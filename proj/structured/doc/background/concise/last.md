# Tree-Sitter Structure Operations for LLM Tools

## Core Problem
LLMs struggle with precise file editing using text-based search/replace. They need semantically-aware operations that target code structures (functions, classes, control blocks) without fragile string matching across entire files.

## API Design

### Operations
```typescript
// Read operations
read_structure(path: string, target: string): StructureResult
read_structures(path: string, targets: string[]): StructureResult[]

// Write operations  
replace_structure(path: string, target: string, content: string): WriteResult
delete_structure(path: string, target: string): WriteResult

// Partial modifications
replace_text_in_structure(path: string, target: string, old_text: string, new_text: string): WriteResult
replace_all_text_in_structure(path: string, target: string, old_text: string, new_text: string, count?: number): WriteResult

// Insertions
insert_before_structure(path: string, target: string, content: string): WriteResult
insert_after_structure(path: string, target: string, content: string): WriteResult

// Move operation
move_structure(path: string, target: string, new_path: string, new_target?: string): WriteResult
```

### Target Syntax Flexibility
Accept all variants, resolve to same structure:
- `"validate_user"` - bare identifier
- `"def validate_user"` - with keyword
- `"def validate_user:"` - with colon
- `"def validate_user(username, password):"` - full signature
- `"class UserAuth"` - class name
- `"if (user.age > 18)"` - control flow by condition

### Error Handling
```typescript
interface StructureError {
  error: string;
  type: 'not_found' | 'ambiguous' | 'syntax_error';
  matches?: Array<{
    line: number;
    preview: string;
    type: string; // 'function' | 'class' | 'method' etc
  }>;
}
```

Fail on ambiguity - no guessing:
```json
{
  "error": "Multiple matches for 'validate'",
  "type": "ambiguous",
  "matches": [
    {"line": 10, "preview": "def validate(self):", "type": "method"},
    {"line": 45, "preview": "def validate_user(username):", "type": "function"}
  ]
}
```

## Implementation Architecture

### Language Support Strategy

**Option 1: Precompiled Set** (Recommended)
```typescript
// Build time: Include common languages
const BUNDLED_LANGUAGES = [
  'tree-sitter-javascript',
  'tree-sitter-typescript', 
  'tree-sitter-python',
  'tree-sitter-rust',
  'tree-sitter-go',
  'tree-sitter-java',
  'tree-sitter-cpp',
  'tree-sitter-c-sharp',
  'tree-sitter-ruby'
];
```

**Option 2: Dynamic Loading** (Complex)
```typescript
// Runtime: Download and compile WASM
async function loadLanguage(lang: string) {
  const wasm = await fetch(`https://unpkg.com/tree-sitter-${lang}/tree-sitter-${lang}.wasm`);
  return await Parser.Language.load(wasm);
}
```

Recommendation: Ship with top 10 languages. Dynamic loading adds complexity for marginal benefit.

### Parser Management
```typescript
import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';

class StructureParser {
  private parsers: Map<string, Parser> = new Map();
  
  constructor() {
    // Pre-initialize parsers
    const languages = {
      '.py': Python,
      '.js': JavaScript,
      '.ts': TypeScript.typescript,
      '.tsx': TypeScript.tsx
    };
    
    for (const [ext, language] of Object.entries(languages)) {
      const parser = new Parser();
      parser.setLanguage(language);
      this.parsers.set(ext, parser);
    }
  }
  
  parse(filepath: string, content: string): Parser.Tree {
    const ext = path.extname(filepath);
    const parser = this.parsers.get(ext);
    if (!parser) throw new Error(`Unsupported file type: ${ext}`);
    return parser.parse(content);
  }
}
```

### Target Resolution

```typescript
interface TargetResolver {
  resolve(tree: Parser.Tree, target: string, language: string): Parser.SyntaxNode | null;
}

class FlexibleResolver implements TargetResolver {
  private strategies = [
    this.exactSignature,
    this.partialSignature,
    this.identifierOnly,
    this.controlFlowCondition
  ];
  
  resolve(tree: Parser.Tree, target: string, language: string): Parser.SyntaxNode | null {
    for (const strategy of this.strategies) {
      const matches = strategy(tree, target, language);
      
      if (matches.length === 1) return matches[0];
      
      if (matches.length > 1) {
        throw new AmbiguousError(matches);
      }
    }
    return null;
  }
  
  private identifierOnly(tree: Parser.Tree, target: string, lang: string): Parser.SyntaxNode[] {
    // Strip language keywords
    const name = this.extractIdentifier(target, lang);
    
    // Query all named structures
    const query = this.getLanguageQuery(lang);
    const matches = query.matches(tree.rootNode);
    
    return matches
      .map(m => m.captures[0].node)
      .filter(node => {
        const nameNode = node.childForFieldName('name');
        return nameNode?.text === name;
      });
  }
  
  private extractIdentifier(target: string, lang: string): string {
    const patterns: Record<string, RegExp> = {
      python: /(?:def|class|async def)\s+(\w+)/,
      javascript: /(?:function|class|const|let|var)\s+(\w+)/,
      typescript: /(?:function|class|interface|type|const|let|var)\s+(\w+)/
    };
    
    const pattern = patterns[lang];
    const match = target.match(pattern);
    return match?.[1] || target.trim();
  }
  
  private getLanguageQuery(lang: string): Parser.Query {
    const queries: Record<string, string> = {
      python: `
        [(function_definition name: (identifier) @name)
         (class_definition name: (identifier) @name)] @structure
      `,
      javascript: `
        [(function_declaration name: (identifier) @name)
         (class_declaration name: (identifier) @name)
         (method_definition key: (property_identifier) @name)
         (variable_declarator name: (identifier) @name)] @structure
      `
    };
    
    return Parser.Query.new(this.getLanguage(lang), queries[lang]);
  }
}
```

### Boundary Detection

Critical: What's included when replacing a structure?

```typescript
class BoundaryDetector {
  getStructureBounds(node: Parser.SyntaxNode, lang: string): Range {
    // Include decorators/annotations
    const decorators = this.getPrecedingDecorators(node, lang);
    const start = decorators[0]?.startIndex ?? node.startIndex;
    
    // Include trailing comma in lists
    const nextSibling = node.nextNamedSibling;
    const hasTrailingComma = nextSibling?.type === ',';
    const end = hasTrailingComma ? nextSibling.endIndex : node.endIndex;
    
    return { start, end };
  }
  
  private getPrecedingDecorators(node: Parser.SyntaxNode, lang: string): Parser.SyntaxNode[] {
    if (lang !== 'python') return [];
    
    const decorators = [];
    let current = node.previousNamedSibling;
    
    while (current?.type === 'decorator') {
      decorators.unshift(current);
      current = current.previousNamedSibling;
    }
    
    return decorators;
  }
}
```

## Critical Design Decisions

### 1. Ambiguity = Error
Never guess. If `"validate"` matches both `validate_user` and `validate_input`, fail with explicit error showing both matches.

### 2. No Substring Matching
`"validate"` does NOT match `"validate_user"`. Only exact identifier matches after stripping syntax.

### 3. Scope Preference
When same name exists at multiple scopes, prefer module-level > class-level > nested. Document this behavior.

### 4. Whitespace Preservation
Maintain indentation and newlines around replaced structures. Parse indentation from original.

### 5. Syntax Error Handling
If replacement creates invalid syntax, write anyway but return warning. Let LLM fix in next iteration.

## Failure Modes

1. **Malformed target syntax**: `"def validate("` - missing closing paren
   - Fallback to identifier extraction
   
2. **Cross-file references**: `"BaseClass.method"` where BaseClass is imported
   - Explicitly unsupported
   
3. **Generic names**: `"__init__"` appears in every Python class
   - Require class qualifier: `"UserAuth.__init__"`
   
4. **Template/Generic syntax**: `"func<T>"` in TypeScript
   - Strip generics for matching
   
5. **Minified code**: Everything on one line
   - Tree-sitter handles this, but error messages will be unhelpful

## Testing Requirements

Each language needs tests for:
- Function/method definitions
- Class definitions  
- Control flow structures
- Nested structures
- Decorator/annotation handling
- Comment preservation
- Multi-line signatures
- Lambda/arrow functions
- Ambiguity detection

## Performance Considerations

- Cache parsed trees (invalidate on file change)
- Reuse parser instances
- Limit tree traversal depth for deeply nested code
- Set maximum file size (e.g., 1MB)

## Alternative Considered: Line-Number Hints

Rejected. Line numbers change frequently and LLMs don't track them reliably. Semantic matching is more robust despite ambiguity challenges.