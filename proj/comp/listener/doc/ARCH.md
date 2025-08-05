# Listener Architecture

## Design Philosophy

**Minimal State, Maximum Reliability**: Track only what's necessary (content hash), handle failures gracefully, provide clear feedback. No complex state machines or recovery logic.

## Key Design Decisions

### File Watching Strategy
- Use `fs.watchFile` with polling (more reliable than fs.watch)
- Poll interval: 500ms default
- Stat-based change detection
- Single watcher per file (error if duplicate)

**Rationale**: fs.watch has platform inconsistencies. Polling is battery-hungry but reliable for single-file monitoring.

### Content Hashing
- Hash file content after stripping any prepended summary section
- Use SHA-256 of content after first "=== END ===" line
- If no summary section, hash entire content
- Hash comparison determines execution

**Note**: Parse errors won't trigger re-execution when fixed (content unchanged).

### Debouncing
- File change starts debounce timer
- Subsequent changes reset timer
- Only process after quiet period
- Default: 500ms

**Rationale**: Editors often write multiple times. Prevents redundant execution during typing.

### Output Coordination

**Three destinations, specific order**:
1. Write `.slupe-output-latest.txt` (same directory)
2. Prepend summary to input file (with blank first line)
3. Copy full output to clipboard
4. Update first line with clipboard status

**Failure handling**:
- Output file fails: Continue, log error
- Prepend fails: Abort (can't update user's file)
- Clipboard fails: Note in first line
- All operations independent

### Summary Format
```
[blank line for clipboard status]
=== SLUPE RESULTS ===
{id} ✅ {action} {primary_param}
{id} ❌ {action} {primary_param} - {error_summary}
=== END ===
```

example after copy:

```
📋 Copied to clipboard
=== SLUPE RESULTS ===
c8i ✅ write_file /path/to/file.md
qb2 ❌ write_file /path/to/other.rs - Permission denied
v84 ✅ exec javascript - 17 lines
=== END ===
```

### Full Output Format
```
=== SLUPE RESULTS ===
[same as summary]
=== OUTPUTS ===
[{id}] {action} {primary_param}:
{output content}

[{id}] {action} {primary_param}:
{output content}
=== END ===
```

### Output Display Rules
Read from unified-design.yaml per action:
- `output_display: always` - Include in OUTPUTS section
- `output_display: never` - Summary only
- `output_display: conditional` - Check return_output parameter

### Truncation
- 50KB limit per action output
- UTF-8 aware truncation
- Show first 25KB + last 25KB
- Clear truncation message

### Race Condition Acceptance
**Problem**: User edits during processing
**Solution**: Document-only. No locking or conflict resolution.
**Rationale**: Toy project, complex solutions not warranted.

### Process Lifecycle
1. **Watch** - fs.watchFile on config.filePath
2. **Detect** - mtime change triggers debounced handler
3. **Read** - Load file content
4. **Strip** - Remove prepended summary section if present
5. **Hash** - Compute hash of remaining content
6. **Compare** - Skip if hash matches lastExecutedHash
7. **Execute** - Call orchestrator.execute() with full file
8. **Format** - Generate summary and full output from results
9. **Write** - Output file, prepend summary, clipboard
10. **Update** - Store new hash

## Error Messages

Formatted for developer clarity:
- "listener: File not found '{path}'"
- "listener: Already watching '{path}'"
- "listener: Permission denied writing output '{path}'"
- "listener: Clipboard write failed"

