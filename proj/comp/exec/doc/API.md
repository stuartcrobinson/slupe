# Component: exec

## Component Type
standard

## Dependencies
[Provisional - updated via STOP protocol when implementation reveals actual needs]

```yaml
dependencies:
  node:child_process:
    functions: [spawn]
    types: [SpawnOptions, ChildProcess]
  
  node:fs/promises:
    functions: [access]
    constants: [F_OK]
    
  node:path:
    functions: [resolve]
    
  node:util:
    functions: [promisify]
```

## Exports

```yaml
exports:
  functions: [executeCommand, mapLanguageToCommand, buildSpawnOptions, formatExecResult]
  types: [ExecResult, ExecError]
  errors: [ExecError]
```

### executeCommand
- **Signature**: `executeCommand(action: SlupeAction) -> Promise<ExecResult>`
- **Purpose**: Execute code from parsed NESL action in specified language.
- **Throws**: Never - all errors captured in ExecResult
- **Test-data**: `test-data/executeCommand.json` [PLANNED]

### mapLanguageToCommand
- **Signature**: `mapLanguageToCommand(lang: string, code: string) -> {command: string, args: string[]}`
- **Purpose**: Convert language and code to spawn command and arguments.
- **Throws**: `ExecError` when language not supported
- **Test-data**: `test-data/mapLanguageToCommand.json` [PLANNED]

### buildSpawnOptions
- **Signature**: `buildSpawnOptions(cwd?: string) -> SpawnOptions`
- **Purpose**: Create spawn options with validated working directory.
- **Throws**: `ExecError` when cwd doesn't exist
- **Test-data**: `test-data/buildSpawnOptions.json` [PLANNED]

### formatExecResult
- **Signature**: `formatExecResult(exitCode: number, stdout: string, stderr: string, error?: Error) -> ExecResult`
- **Purpose**: Format raw execution results into standardized response.
- **Test-data**: `test-data/formatExecResult.json` [PLANNED]

## Types

### ExecResult
```typescript
{
  success: boolean
  stdout?: string        // Captured standard output
  stderr?: string        // Captured standard error  
  exit_code?: number     // Process exit code
  error?: string         // Error message if failed
}
```

### ExecError
```typescript
class ExecError extends Error {
  code: string          // e.g., 'LANG_UNSUPPORTED', 'TIMEOUT', 'CWD_INVALID'
  details?: any         // Additional context
}
```

## Internal Functions
[To be discovered during implementation]

### runProcess
- **Signature**: `runProcess(command: string, args: string[], options: SpawnOptions) -> Promise<ProcessResult>`
- **Purpose**: Spawn and monitor child process with timeout handling.

### checkCommandExists
- **Signature**: `checkCommandExists(command: string) -> Promise<boolean>`
- **Purpose**: Verify interpreter is available before execution.

### truncateOutput
- **Signature**: `truncateOutput(text: string, maxSize: number) -> string`
- **Purpose**: Trim output from middle preserving start/end if too large.