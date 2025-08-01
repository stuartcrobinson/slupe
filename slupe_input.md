Looking at the code you've provided, I can see the call chain. Here's how to add timing to `FsOpsExecutor.execute()`:

```sh nesl
#!nesl [@three-char-SHA-256: x9k]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/fs-ops/src/index.ts"
old_text = <<'EOT_x9k'
  async execute(action: SlupeAction): Promise<FileOpResult> {
    try {
      // Check fs-guard permissions first
      const guardResult = await this.guard.check(action);
      if (!guardResult.allowed) {
        return {
          success: false,
          error: `fs-guard violation: ${guardResult.reason}`
        };
      }

      const handler = this.handlers.get(action.action);
      if (!handler) {
        // Check if it's a known but not implemented action
        if (NOT_IMPLEMENTED.has(action.action)) {
          return {
            success: false,
            error: `Action not yet implemented: ${action.action}`
          };
        }
        // Truly unknown action
        return {
          success: false,
          error: `Unknown action: ${action.action}`
        };
      }

      return await handler(action);
    } catch (error: any) {
      // This should never happen - handlers should catch their own errors
      return {
        success: false,
        error: `Unexpected error in execute: ${error.message}`
      };
    }
  }
EOT_x9k
new_text = <<'EOT_x9k'
  async execute(action: SlupeAction): Promise<FileOpResult> {
    try {
      // Check fs-guard permissions first
      console.time('guard-check');
      const guardResult = await this.guard.check(action);
      console.timeEnd('guard-check');
      
      if (!guardResult.allowed) {
        return {
          success: false,
          error: `fs-guard violation: ${guardResult.reason}`
        };
      }

      const handler = this.handlers.get(action.action);
      if (!handler) {
        // Check if it's a known but not implemented action
        if (NOT_IMPLEMENTED.has(action.action)) {
          return {
            success: false,
            error: `Action not yet implemented: ${action.action}`
          };
        }
        // Truly unknown action
        return {
          success: false,
          error: `Unknown action: ${action.action}`
        };
      }

      console.time('handler-execute');
      const result = await handler(action);
      console.timeEnd('handler-execute');
      return result;
    } catch (error: any) {
      // This should never happen - handlers should catch their own errors
      return {
        success: false,
        error: `Unexpected error in execute: ${error.message}`
      };
    }
  }
EOT_x9k
#!end_x9k
```

This will add timing logs to show:
- How long the fs-guard permission check takes
- How long the actual file operation handler takes

This should help identify if the bottleneck is in the guard checks or the actual file operations.