# fs-guard Architecture

## Design Philosophy

**Minimal Scope, Maximum Clarity**: Only validate fs-ops paths. No exec sandboxing, no network controls, no resource limits. Clear error messages for LLM comprehension.

## Key Design Decisions

### Integration Point
- Intercept at fs-ops `executeFileOperation` before action dispatch
- Single validation point for all file system operations
- No modifications to individual operation handlers

**Rationale**: Clean separation of concerns. Filesystem guards remains pluggable.

### Path Resolution Strategy
1. Canonicalize input path via `fs.realpath()`
2. Canonicalize all rule patterns on config load
3. Match canonical path against canonical patterns

**Rationale**: Prevents symlink traversal attacks. Makes rules predictable.

### Rule Precedence: Most Specific Wins
```yaml
read:
  allow: ["/home/**"]
  deny: ["/home/user/.ssh/**"]  # More specific, wins
```

Specificity = count of non-wildcard path segments.

**Rationale**: Enables "deny directory, allow subdirectory" patterns naturally.

### Permission Model
```typescript
const actionPermissions = {
  read_file: ['read'],
  write_file: ['write'],
  file_create: ['write'],
  delete_file: ['write'],
  replace_text_in_file: ['read', 'write'],
  replace_all_text_in_file: ['read', 'write'],
  move_file: ['read:old_path', 'write:new_path'],
  read_files: ['read:paths'],
  read_file_numbered: ['read'],
  // dir operations similar
}
```

**Rationale**: Operations have inherent permission requirements. Move needs read on source, write on destination.

### Configuration Schema
```yaml
fs-guard:
  fs:
    read:
      allow: ["./src/**", "/tmp/**"]
      deny: ["/tmp/ssh-*"]
    write:
      allow: ["./src/**", "/tmp/slupe-**"]
      deny: ["**/.git/**"]
```

Relative paths resolved from slupe.yml directory.

**Rationale**: Separating read/write enables "read-only" access patterns.

### Error Format
```typescript
{
  success: false,
  error: "fs-guard violation: Write access denied for '/etc/passwd'"
}
```

Not: "EACCES: permission denied" (ambiguous with OS permissions).

**Rationale**: LLM needs to distinguish fs-guard policy from system errors.

### Canonicalization Failures
If `fs.realpath()` fails (file doesn't exist yet):
- For write operations: Check non-canonical path
- For read operations: Deny (file doesn't exist anyway)

**Rationale**: Can't canonicalize paths that don't exist, but need to validate writes creating new files.

### Default Policy
not sure about this.  maybe defauls is that `/` is denied for everything?  so specific whitelists are needed?  and maybe the current repo is whitelisted?  


### TOCTOU Acceptance
Race condition between canonicalization and operation is unsolvable without filesystem locks.

**Documented limitation**: Paths can change between check and use.

## Performance Considerations

### Canonicalization Cache
Don't cache. Filesystem state changes; cache invalidation is error-prone.

**Rationale**: Correctness over performance for filesystem guardrail.

### Pattern Compilation
Compile glob patterns once at config load, not per check.

**Rationale**: Glob compilation is expensive; patterns are static.

## Glob Library Choice
Use `minimatch` with options:
```typescript
{
  dot: true,      // Match hidden files
  nonegate: true, // No '!' patterns
  nocase: false   // Case sensitive
}
```

**Rationale**: Most common, well-tested. Options prevent surprises.

## Operation-Specific Logic

### move_file
- Check read permission on `old_path`
- Check write permission on `new_path`
- Both must pass

### read_files
- Extract each path from multi-line `paths` parameter
- Check read permission on each
- Fail fast on first denial

### New File Creation
- Parent directory must exist for canonicalization
- If parent missing, check non-canonical path
- Let fs-ops handle missing parent error

## Testing Strategy
Test cases must verify:
1. Symlink traversal blocked
2. Most-specific matching
3. Relative path resolution
4. Non-existent path handling
5. Each operation's permission mapping
