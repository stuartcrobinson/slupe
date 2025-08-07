# Structure Operations API - Complete Specification

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
- Target format: Multi-line string, each line identifying a structure level:
  ```
  UserAuth
  validate
  if user.is_active
  ```
- Matching is flexible: `validate`, `def validate`, `def validate(self):` all match same structure

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
- UTF-8 encoding required
- Max file size: 10MB
- Creates parent directories automatically (recursive mkdir)
- Symlinks: Not explicitly handled (will be read/written as regular files)
- Permissions: Fail with EACCES if no write permission
- Atomic operations at file level
- Concurrent modification detection via hash

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

## Remaining Ambiguities

### 1. Move Operation Atomicity
For moves between files: If source deletion succeeds but destination write fails, is the source restored? The note says "ensure write permissions for both files before doing anything" but doesn't specify rollback behavior.

--> there is no rollback behavior.  the system saves the state between sets of actions.  as git commits.  so in the case of catastrophe or fs coruption the user can just revert to prior commit

### 2. Nested Structure Addressing
Can targets address nested structures like `"MyClass.inner_method"`? The multi-line format suggests yes, but it's not explicitly stated.

--> yes.  every parsed markdown section including list items, and every code block (classes functions modules coniditionals control (while/for loops etc) ) can be valid targets. the LLM just refers to them by the first 50 chars of whatever.  in a particular way that we'll figure out later.  like after normalizing the "header" (so like the first 50 chars of a list item counts as its header, etc) and the underlying text

### 3. Anonymous Functions
How are lambdas/anonymous functions targeted? Can they be targeted at all?

--> yeah the same was as i described in #2 above.  ever code block can be targeted.  basically the first line is always considered to be the header.  but maybe for code we'll do code specific normalization to amke things easier for LLM so they can use "validate_user" instead of "def validate_user:" etc

### 4. Structure Definition for Different Languages
What exactly constitutes a "structure" in each language? Just classes/functions/methods, or also:
- Type definitions?
- Enum declarations?
- Interface definitions?
- Global variables?

--> all of the above. and markdown structures including list items etc

### 6. Content Size Limits
The original mentioned 1MB max for content parameter, but this isn't validated in existing fs-ops code. Should it be enforced?

--> yes