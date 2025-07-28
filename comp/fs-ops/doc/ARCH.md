# fs-ops Architecture

## Design Philosophy

**Defensive Operations with Clear Errors**: Every operation should handle common failure cases gracefully and return descriptive errors that help the LLM understand what went wrong.

## Key Design Decisions

### Parent Directory Creation
- `file_write` automatically creates parent directories.  creates parent directory if it doesn't exist

### Text Replacement Strategy  
- Use exact string matching for both replace actions
- `file_replace_text`: Must find EXACTLY ONE occurrence (fails if 0 or 2+)
- `file_replace_all_text`: Replaces all occurrences, validates count if provided
- Empty old_text validation: Both actions reject empty search strings
- Return actual number of replacements made
- No regex support (keep it simple, predictable)

### Error Handling
- Never throw - return errors in result object
- Include original error codes (ENOENT, EACCES)
- Add context about what operation was attempted
- Preserve stack traces for debugging

### Path Resolution
- All paths must be absolute (validated by parser)
- No path traversal validation (security is out of scope for v1)
- Symlinks followed transparently

### Directory Operations
- `dir_delete` only removes empty directories
- No recursive deletion option (safety)
- `ls` returns flat listing with type info

### Search Operations
- `grep` uses simple substring matching
- Include patterns use glob syntax
- Results include line numbers
- Large file handling: streaming for files >10MB

## Performance Considerations

- File operations are synchronous from caller perspective
- No caching of file contents
- No watch/monitor capabilities
- Each operation is independent

## Encoding

- All text files assumed UTF-8
- Binary files not supported in v1
- Line endings preserved as-is

## Limits

- Max file size: 10MB (from unified-design.yaml)
- No limit on number of operations
- No timeout on individual operations

## Test Conventions

- Test files use `/tmp/t_{test-name}/` path pattern for isolation
- Each test creates its own subdirectory to avoid conflicts
- Integration tests track created paths for cleanup

## Future Considerations

- Batch operations for efficiency
- Binary file support
- File watching/monitoring
- Atomic write operations (write to temp, rename)
- Path validation against allowlist


# fs-ops ARCH.md - Additional Sections

## File Move Behavior

### Overwrite Semantics
- `file_move` overwrites existing destination files without warning
- Matches Unix `mv` behavior and Node.js `rename()` semantics  
- Rationale: LLM can check first if needed, but overwrite-by-default enables single-shot operations
- Return data includes `overwrote: true` when destination existed

### Directory Creation
- `file_move` automatically creates parent directories for destination path
- Diverges from standard `rename()` which fails with ENOENT
- Rationale: Reduces LLM round-trips for common "move to new location" pattern

## Error Message Enhancement

### Problem: Ambiguous ENOENT
Node.js returns ENOENT for multiple distinct failures:
- Source file doesn't exist
- Destination directory doesn't exist  
- Parent directory permissions (sometimes)

### Solution: Pre-flight Checks
Operations perform checks before system calls to provide specific errors:
- `file_move`: Check source exists → "Source file not found" vs generic ENOENT
- `file_write`: Already creates parent dirs, avoiding ambiguity
- `file_delete`: Pass through Node errors (unambiguous)

### Error Format
When enhancing errors for LLM clarity:
```
{operation}: {specific_issue} '{path}' ({error_code})
```

Example: `file_move: Source file not found '/tmp/ghost.txt' (ENOENT)`