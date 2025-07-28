# exec Architecture

## Design Philosophy

**Transparent Execution with Clear Boundaries**: Execute code exactly as provided, capture all output, enforce reasonable limits. No magic, no hidden behavior.

## Key Design Decisions

### Process Spawning Strategy
- Use `child_process.spawn` for all languages
- Each execution gets fresh process (no state persistence)
- Inherit parent environment variables
- No shell wrapping except for bash (security: avoid shell injection)

### Language Mapping
```javascript
const interpreters = {
  bash: { command: 'bash', args: ['-c'] },
  javascript: { command: 'node', args: ['-e'] },
  python: { command: 'python3', args: ['-c'] },
};
```

**Rationale**: 
- Use explicit interpreter commands vs PATH lookup
- Python defaults to python3 (Python 2 is EOL)
- No version management in v1 (ignore version parameter)

### Timeout Handling
- **Default timeout**: 30 seconds
- **Timeout behavior**: Kill process (SIGTERM then SIGKILL)
- **Partial output**: Return captured stdout/stderr even on timeout
- **Error message**: Include timeout duration in error

**Rationale**: Prevent hanging processes while preserving diagnostic output

### Output Capture
- **Strategy**: Buffer complete output before returning
- **Size limit**: 1MB combined stdout/stderr
- **Encoding**: UTF-8 only
- **Truncation**: Trim from middle, preserve start/end
- **Line endings**: Preserve as-is

**Rationale**: Simple implementation, predictable memory usage

### Working Directory
- **Default**: Current process working directory
- **Validation**: Check directory exists before spawning
- **Error handling**: Fail fast with clear error
- **No chdir**: Don't change parent process cwd

### Error Handling Hierarchy
1. **Pre-execution errors** (our code):
   - Invalid language
   - Missing interpreter
   - Invalid working directory
   - Return `{success: false, error: "..."}` 

2. **Execution errors** (child process):
   - Non-zero exit code
   - Process crash
   - Return `{success: false, exit_code: N, stdout: "...", stderr: "..."}`

3. **Resource errors**:
   - Timeout
   - Output size exceeded
   - Out of memory
   - Return partial results + error

### Security Model
- **No sandboxing**: Trust LLM like a developer
- **No input validation**: Execute code as-is
- **No privilege dropping**: Inherit parent permissions
- **Audit trail**: Log all executions (future feature)

**Rationale**: Matches slupe's trust model - LLM is the developer

### Edge Cases

**Missing Interpreter**:
- Check command exists before spawning
- Return helpful error: "python3 not found in PATH"

**Zombie Processes**:
- Ensure proper process cleanup on timeout
- Use tree-kill if process spawns children

**Binary Output**:
- Detect non-UTF8 output
- Return error rather than corrupted text

**Interactive Commands**:
- Not supported - no stdin
- Commands expecting input will hang until timeout

## Implementation Notes

### Process Spawn Options
```javascript
{
  cwd: parameters.cwd || process.cwd(),
  env: process.env,  // Inherit all
  shell: false,      // Except bash
  windowsHide: true,
  timeout: 30000     // Node handles this
}
```

### Output Buffering
- Use string concatenation for simplicity
- Monitor buffer size during capture
- Stop reading if limit exceeded

### Error Message Format
Consistent pattern for LLM parsing:
```
"{operation}: {specific_issue} ({error_code})"
```

Examples:
- "exec: python3 not found in PATH (ENOENT)"
- "exec: Working directory does not exist '/tmp/ghost' (ENOENT)"
- "exec: Process timeout after 30s (TIMEOUT)"

## Future Considerations

### v2 Features
- Streaming output for long-running processes
- Custom environment variables
- Version management (nvm, pyenv)
- Resource limits (memory, CPU)
- Stdin support for interactive scripts
- Parallel execution
- Container/VM isolation

### Known Limitations
- No Windows-specific shell support (cmd, PowerShell)
- Python version conflicts (system python vs virtual envs)
- No signal handling beyond timeout
- No partial execution recovery