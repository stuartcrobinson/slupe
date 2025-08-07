# Structure Operations Implementation Plan

## Architecture Decisions

### New Components

Three new components will be created, with a fourth (fs-io) extracted from existing functionality:

```
proj/comp/fs-io/
├── src/
│   ├── index.ts            # exports initialize(), readFile(), writeFile()
│   └── guarded-fs.ts       # singleton FsGuard wrapper

proj/comp/parsers/
├── src/
│   ├── index.ts           # ParserRegistry, getParser(filepath)
│   ├── types.ts           # ParsedStructure interface
│   ├── code/
│   │   ├── tree-sitter-manager.ts  # singleton parser instances
│   │   ├── languages/
│   │   │   ├── typescript.ts
│   │   │   └── python.ts
│   │   └── code-parser.ts          # implements ParsedStructure
│   ├── markdown/
│   │   └── remark-parser.ts        # implements ParsedStructure
│   └── plaintext/
│       └── line-parser.ts          # implements ParsedStructure

proj/comp/struct-ops/
├── src/
│   ├── index.ts
│   ├── target-resolver.ts
│   ├── indentation.ts
│   ├── validator.ts
│   ├── actions/
│   │   ├── read_structure.ts
│   │   ├── replace_structure.ts
│   │   ├── delete_structure.ts
│   │   ├── replace_text_in_structure.ts
│   │   ├── replace_all_text_in_structure.ts
│   │   ├── insert_before_structure.ts
│   │   ├── insert_after_structure.ts
│   │   ├── move_structure_to_before.ts
│   │   ├── move_structure_to_after.ts
│   │   ├── move_structure_to_file_start.ts
│   │   └── move_structure_to_file_end.ts
│   ├── resolvers/
│   │   ├── code-resolver.ts
│   │   ├── markdown-resolver.ts
│   │   └── plaintext-resolver.ts
│   ├── processors/
│   │   ├── code-processor.ts
│   │   └── markdown-processor.ts
│   └── utils/
│       ├── error-types.ts
│       └── result-types.ts
```

### Component Responsibilities

**fs-io**: Centralized file I/O with FsGuard validation. All file operations across slupe route through here. Initialized by orchestrator at startup with config and repoPath.

**parsers**: Three separate parser implementations (tree-sitter for code, remark for markdown, line-split for plaintext). No unified abstraction - struct-ops handles three code paths.

**struct-ops**: Structure operations executor. Owns target resolution and indentation adjustment logic. Uses fs-io for all file I/O. Pre-flight validation for move operations to prevent data loss.

### Dependency Graph

- fs-io (depends on fs-guard)
- parsers (no dependencies)
- fs-ops (depends on fs-io) - requires refactoring
- struct-ops (depends on fs-io, parsers)

### Key Design Decisions

1. **Parser management**: Singleton pattern for tree-sitter parsers (one per language, lazy init)

2. **Target resolution**: Owned by struct-ops, not parsers. Uses "first 50 chars" matching (implementation details deferred)

3. **Indentation**: Handled by struct-ops, not parsers. Auto-detects and adjusts indentation for moved/inserted content

4. **No concurrent modification detection**: No hash checking or atomicity. Users rely on git for recovery

5. **Markdown parsing**: Use remark-sectionize for hierarchical section understanding

6. **Plaintext fallback**: Unknown file types parsed as line-based structures (one line = one structure)

7. **FsGuard enforcement**: Every fs operation routes through fs-io, which always validates permissions

8. **Move operation safety**: Pre-flight validation reads both files and validates before any writes

### Error Types

Struct-ops will define specific error types for LLM comprehension:
- PARSE_ERROR - syntax errors prevent AST building
- TARGET_NOT_FOUND - structure doesn't exist
- TARGET_AMBIGUOUS - multiple matches (except read_structure)
- STRUCTURAL_INVALID - operation would break syntax
- IO_ERROR - propagated from fs-io

### Implementation Order

1. fs-io component (prerequisite)
2. parsers/code with typescript only
3. struct-ops with read_structure only
4. Add replace_structure
5. Add remaining operations
6. Add python support
7. Add markdown (defer)
8. Add plaintext (defer)

### Deferred Decisions

- Extension to parser mapping strategy
- Specific ParsedStructure interface shape
- Markdown heading hierarchy edge cases
- Target resolution implementation ("first 50 chars" details)

## Followups

### 1. Circular dependency between components
Acknowledged - circular deps allowed. struct-ops can call fs-ops.execute() if needed.

### 2. Orchestrator integration
- Add struct-ops to executor map in `Slupe.initializeExecutors()`
- Call `fs-io.initialize(config, repoPath)` before creating any executors
- Add structure operation names to `ActionDefinitions` in `unified-design.ts`
- Config allowed-actions needs new entries: `read_structure`, `replace_structure`, etc.

### 3. Parser selection logic
- Extension mapping in `parsers/index.ts`:
  ```
  .ts, .tsx, .js, .jsx, .mjs → typescript parser
  .py → python parser  
  .md → remark parser
  others: read hash bang at top of file 
  All others → plaintext parser unless binary 
  binary? fail/error
  ```
- No fallback chain - deterministic mapping

### 4. Structure boundaries (from original spec)
- **Decorators**: Included with decorated structure (spec says "Decorators included with their decorated structure")
- **Doc comments**: "Doc comments preceding structure" included (from spec)
- **Inline comments**: Not addressed in spec - exclude for now
- **Empty lines**: Excluded from structure boundaries, maintained between structures by system

### 5. Testing strategy
TDD approach confirmed. Start with read_structure tests to validate parser integration before write operations.