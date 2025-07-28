# HooksManager Pseudocode

```javascript
class HooksManager {
  constructor(config?: HooksConfig) {
    this.config = config || { hooks: {}, vars: {} }
  }

  async runBefore(context?: HookContext): Promise<HookResult> {
    // Get before commands
    const commands = this.config.hooks?.before || []
    
    // Execute commands sequentially
    const results = []
    for (const cmd of commands) {
      // extractedFn: interpolateCommand(cmd: Command, vars: Record<string, any>, context?: HookContext): Command
      const interpolatedCmd = interpolateCommand(cmd, this.config.vars || {}, context)
      
      // extractedFn: validateCommand(cmd: Command): ValidationResult
      const validation = validateCommand(interpolatedCmd)
      if (!validation.valid) {
        results.push({ command: cmd.run, error: validation.error, success: false })
        if (!cmd.continueOnError) {
          break
        }
        continue
      }
      
      // Execute command (impure - will mock in tests)
      try {
        const result = await executeShellCommand(interpolatedCmd)
        results.push({ command: cmd.run, ...result })
        if (!result.success && !cmd.continueOnError) {
          break
        }
      } catch (error) {
        results.push({ command: cmd.run, error: error.message, success: false })
        if (!cmd.continueOnError) {
          break
        }
      }
    }
    
    // extractedFn: formatHookResult(results: CommandResult[]): HookResult
    return formatHookResult(results)
  }

  async runAfter(context?: HookContext): Promise<HookResult> {
    // Identical to runBefore but with after commands
    const commands = this.config.hooks?.after || []
    // ... same logic
  }

  async loadConfig(path: string): Promise<HooksConfig> {
    // Read file
    const content = await readFile(path, 'utf8')
    
    // extractedFn: parseYamlConfig(content: string): HooksConfig
    const config = parseYamlConfig(content)
    
    // extractedFn: validateConfig(config: any): ValidationResult
    const validation = validateConfig(config)
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.error}`)
    }
    
    return config
  }
}

// Helper for shell execution (impure)
async function executeShellCommand(cmd: Command): Promise<CommandResult> {
  const { promisify } = require('util')
  const { exec } = require('child_process')
  const execAsync = promisify(exec)
  
  const timeout = cmd.timeout || 30000
  const options = {
    cwd: cmd.cwd || process.cwd(),
    timeout
  }
  
  try {
    const { stdout, stderr } = await execAsync(cmd.run, options)
    return { success: true, stdout, stderr }
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    }
  }
}
```

## Discovered Pure Functions

1. **interpolateCommand** - Replace ${VAR} patterns with values
   - Input: Command, variables, optional context
   - Output: Command with interpolated run string
   - Complexity: Handle missing vars, escaping, defaults

2. **validateCommand** - Check command is executable
   - Input: Command
   - Output: ValidationResult { valid: boolean, error?: string }
   - Checks: Non-empty run, valid timeout, etc.

3. **formatHookResult** - Convert command results to HookResult
   - Input: Array of command execution results
   - Output: HookResult with success, count, errors
   - Logic: Overall success = all succeeded

4. **parseYamlConfig** - Parse YAML to HooksConfig
   - Input: YAML string
   - Output: HooksConfig object
   - Uses js-yaml, handles parse errors

5. **validateConfig** - Validate config structure
   - Input: Parsed config object
   - Output: ValidationResult
   - Checks: Valid structure, command formats

6. **mergeConfigs** - Merge base and override configs (discovered need)
   - Input: Two HooksConfig objects
   - Output: Merged HooksConfig
   - Logic: Deep merge with override precedence

## Additional Types Discovered

```typescript
interface CommandResult {
  success: boolean
  error?: string
  stdout?: string
  stderr?: string
}

interface ValidationResult {
  valid: boolean
  error?: string
}
```

## Next Steps

1. Create unit test data for each pure function
2. Implement functions
3. Mock executeShellCommand for testing
4. Integration tests with real shell commands