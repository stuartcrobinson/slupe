# Structure Operations API - Complete Specification

## Overview

These operations enable LLMs to manipulate code and document structures at a semantic level rather than line-by-line. An LLM can target "the validate_user function" instead of calculating line numbers, making edits more robust against file changes and more natural to express.

The API treats files as hierarchical structures - functions, classes, methods, conditionals, loops, and even markdown sections. Each operation targets structures by name, with the system handling the underlying AST parsing, indentation adjustment, and boundary detection. This abstraction allows LLMs to perform complex refactoring operations that would be error-prone with text manipulation alone, while maintaining syntactic validity through parser-awareness.

## Core Operations

```typescript
// Read
read_structure(path: string, target: string): Result
// Returns all matches. Only operation allowing multiple target matches.

// Write
replace_structure(path: string, target: string, content: string): Result
delete_structure(path: string, target: string): Result

// Text modifications
replace_text_in_structure(path: string, target: string, old_text: string, new_text: string): Result
// Requires exactly ONE occurrence of old_text in target structure

replace_all_text_in_structure(path: string, target: string, old_text: string, new_text: string, expected_count?: number): Result
// Replaces ALL occurrences. Optional expected_count validates total replacements.

// Insertions
insert_before_structure(path: string, target: string, content: string): Result
// Adds newline after content if needed

insert_after_structure(path: string, target: string, content: string): Result  
// Adds newline before content if needed

// Movement
move_structure_to_before(source_path: string, source_target: string, dest_path: string, dest_target: string): Result
move_structure_to_after(source_path: string, source_target: string, dest_path: string, dest_target: string): Result
move_structure_to_file_start(source_path: string, source_target: string, dest_path: string): Result
move_structure_to_file_end(source_path: string, source_target: string, dest_path: string): Result
```

## Behavioral Specifications

### Target Matching Rules
- **All operations require unique target match EXCEPT `read_structure`**
- `read_structure` returns all matches for educational purposes
- All other operations fail with `TARGET_AMBIGUOUS` if multiple matches exist
- **Target format**: Multi-line string, each line identifying a nested structure level:
  ```
  UserAuth              # class/module level
  validate              # method/function level
  if user.is_active     # conditional level
  ```
- **Empty target string (`""`)**: Targets file root/module scope
- **Each line must specify the exact path** - no skipping intermediate levels
- **Matching uses literal first 50 characters** of the structure's source text (no normalization)
  - `def validate(self):` is different from `validate(self):`
  - Includes keywords, punctuation, whitespace as written

### Structure Boundaries Include
- Decorators (Python)
- Annotations (Java)
- Doc comments preceding structure
- Full body including nested structures

### Text Matching
- **Case sensitive** exact match including whitespace
- Does not match across structure boundaries
- Within structure bounds only
- Line endings normalized to `\n` (like git CLI tools)

### File Handling (from existing fs-ops patterns)
- UTF-8 encoding required (fails with ENCODING_ERROR otherwise)
- Max file size: 10MB
- Creates parent directories automatically (recursive mkdir)
- Symlinks: Treated as regular files (no special handling)
- Permissions: Operations fail with PERMISSION_DENIED if insufficient
- **Parser requirement**: Operations fail with PARSER_FAILED if file has syntax errors
- Atomic operations at single-file level only

### Newline Handling
- `insert_before_structure`: Adds newline after content if next line is non-empty
- `insert_after_structure`: Adds newline before content if previous line is non-empty
- System maintains single blank line between structures

### Indentation
- Content provided at zero indent
- System adjusts to match destination context
- Preserves relative indentation within provided content

### Line Numbers
- 1-indexed
- Inclusive ranges [start, end]
- Recalculated fresh for each operation (no transaction support)

### Markdown Structure Matching
- Headings: Match heading text
- List items: Match first 50 chars of item text
- Code blocks: Match language tag or first line
- Blockquotes: Match first line of quote

## Error Responses

```typescript
interface ErrorResponse {
  error: string;
  message: string;
  details: {
    state: "FILE_UNCHANGED";
    [key: string]: any;
  };
}
```

| Error | When | Details |
|-------|------|---------|
| TARGET_NOT_FOUND | No match for target | searched_path, parent_found, suggestions |
| TARGET_AMBIGUOUS | Multiple matches (except read_structure) | matches[] |
| TEXT_NOT_FOUND | old_text not in structure | structure_lines, structure_matched |
| TEXT_AMBIGUOUS | old_text appears multiple times | occurrences, lines |
| COUNT_MISMATCH | expected_count != actual | expected, found |
| FILE_NOT_FOUND | Path doesn't exist | - |
| FILE_TOO_LARGE | File > 10MB | file_size, limit |
| PERMISSION_DENIED | No write access | operation |
| LANGUAGE_UNSUPPORTED | No parser for file type | file, supported[] |
| PARSER_FAILED | Syntax errors prevent parsing | parse_errors[] |

## Result Types

```typescript
interface Result_for_read_structure {
  matches: Array<{
    text: string;
    line_range_inclusive: [number, number];
  }>;
}

interface Result_for_replace_structure {
  lines: [number, number];  // Where new structure written
}

interface Result_for_delete_structure {
  deleted_line_range_inclusive: [number, number];
}

interface Result_for_replace_text_in_structure {
  affected_lines: [number, number];
}

interface Result_for_replace_all_text_in_structure {
  total_replacements: number;
  affected_lines: [number, number];
}

interface Result_for_insert_before_structure {
  inserted_at_line: number;
  target_now_at_line: number;
}

interface Result_for_insert_after_structure {
  inserted_at_line: number;
}

interface Result_for_move_structure_to_before {
  source_original_line_range: [number, number];
  destination_final_line_range: [number, number];
}

interface Result_for_move_structure_to_after {
  source_original_line_range: [number, number];
  destination_final_line_range: [number, number];
}

interface Result_for_move_structure_to_file_start {
  source_original_line_range: [number, number];
  destination_final_line_range: [number, number];
}

interface Result_for_move_structure_to_file_end {
  source_original_line_range: [number, number];
  destination_final_line_range: [number, number];
}
```

## Warnings

```typescript
interface Warning {
  type: string;
  message: string;
  details?: object;
}
```

| Warning | When | Details |
|---------|------|---------|
| SYNTAX_BROKEN | File has syntax errors after operation | errors[] |
| STRUCTURE_EMPTY | Structure now contains no code | structure, lines |
| INDENTATION_INCONSISTENT | Indentation doesn't match surroundings | expected_indent, actual_indent, line |

---

## Additional Specifications

### Structure Definition
**All tree-sitter AST nodes are targetable structures:**
- Functions, methods, classes, modules
- Conditionals (if/elif/else as single or separate based on AST)
- Loops (for/while), try/except/finally blocks
- Type definitions, enums, interfaces
- Global variables, constants, module-level code
- Anonymous functions, lambdas, decorators
- Module docstrings (if parsed as expression_statement)
- Markdown sections, headings, list items, code blocks

**Structure boundaries follow tree-sitter parsing:**
- If parsed as one node → one structure (e.g., if_statement including elif/else)
- If parsed as siblings → separate structures
- Decorators included with their decorated structure

**Structure identification:**
- Uses literal first 50 characters of structure's source text
- No normalization - exact text including whitespace, punctuation, keywords
- Module-level structures targeted by their content (e.g., `"""Module documentation"""`)

### Move Operation Behavior
- **No rollback on partial failure** - source may be deleted even if destination write fails
- System auto-commits state between action sets for git recovery
- Pre-flight permission checks recommended but not enforced
- Data loss possible on failure - user recovers via git revert

### Operation Constraints
- `replace_all_text_in_structure`: Only allowed to match ONE structure (fails with TARGET_AMBIGUOUS otherwise)
- `expected_count`: Total replacements in that single structure
- Content parameter max size: 1MB (enforced)


---

# updates 

Move operations are destructive without atomicity. 
- read both files first, validate both operations will succeed, then execute.

