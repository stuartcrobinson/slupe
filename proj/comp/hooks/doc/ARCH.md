# Hooks Architecture

## Design Decisions

### Variable Interpolation
- **Decision**: Interpolate before shell execution
- **Rationale**: Prevents shell injection, predictable behavior
- **Implementation**: Simple string replacement of ${VAR} patterns

### Error Handling
- **Decision**: Fail fast by default
- **Rationale**: Predictable, safe default for VCS operations
- **Override**: Per-command `continueOnError` flag

### Configuration Loading
1. Check `slupe.yml` in repository root

### Command Execution
- Internal shell execution using child_process.exec
- Default cwd is repository root
- Sequential execution (no parallelism)
- Promisified exec for async/await pattern

### Timeout Handling
- Per-command timeout configuration
- Kill entire process tree on timeout
- Default: 30 seconds

## Security Considerations
- Shell escaping via shell-escape library
- No dynamic command construction
- Variables interpolated before shell sees them

## Internal Implementation

### Shell Execution
- Direct use of `child_process.exec` with promisify wrapper
- Custom timeout implementation (exec doesn't support natively)
- Process killing on timeout using process.kill()
- Error standardization for consistent handling

### Process Management
```javascript
// Timeout approach
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Command timeout')), timeout)
);
Promise.race([execPromise, timeoutPromise]);
```
