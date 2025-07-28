# Component: hooks

## Component Type
standard

## Dependencies

```yaml
dependencies:
  external/js-yaml:
    functions: [load]
  
  external/shell-escape:
    functions: [escape]
  
  node:child_process:
    functions: [exec]
  
  node:util:
    functions: [promisify]
```

## Exports

```yaml
exports:
  classes:
    HooksManager:
      constructor: [config?: HooksConfig]
      methods: [runBefore, runAfter, loadConfig]
  types:
    - HooksConfig
    - Command
    - HookContext
    - HookResult
```

### HooksManager (class)
- **Purpose**: Manages lifecycle hooks for command execution
- **Constructor**: `new HooksManager(config?: HooksConfig)`
- **State**: Loaded configuration and variable context

### runBefore
- **Signature**: `async runBefore(context?: HookContext): Promise<HookResult>`
- **Purpose**: Execute all before hooks sequentially
- **Throws**: First command failure unless continueOnError

### runAfter  
- **Signature**: `async runAfter(context?: HookContext): Promise<HookResult>`
- **Purpose**: Execute all after hooks sequentially
- **Throws**: First command failure unless continueOnError

### loadConfig
- **Signature**: `async loadConfig(path: string): Promise<HooksConfig>`
- **Purpose**: Load hooks configuration from YAML file
- **Throws**: `Error` on invalid YAML or missing file

### HooksConfig (type)
```typescript
interface HooksConfig {
  hooks?: {
    before?: Command[];
    after?: Command[];
  };
  vars?: Record<string, string>;
}
```

### Command (type)
```typescript
interface Command {
  run: string;
  continueOnError?: boolean;
  timeout?: number;
  cwd?: string;
}
```

### HookContext (type)
```typescript
interface HookContext {
  [key: string]: string | number | boolean;
}
```

### HookResult (type)
```typescript
interface HookResult {
  success: boolean;
  executed: number;
  errors?: Array<{
    command: string;
    error: string;
  }>;
}
```