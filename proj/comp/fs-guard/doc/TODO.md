need to update slupe.yaml config handling:

https://claude.ai/chat/50860d9f-c4eb-4b91-980c-522e89bdfc1c


> Your current design has fs-guard at the executor level, but executors are stateless.

> huh?



> and how are the configs currently getting passed around?  and what do you think is the correct way to do that  regardless of what we're doing now? it might be kind of a mess.  since that yaml file wasn't introduced until the most recent component we wrote, hooks.

---

Looking at the code:

## Current Config Flow

1. **hooks**: Config passed via constructor OR loaded from `slupe.yml`
2. **fs-ops/exec**: No config mechanism - they're pure executors
3. **orch**: Creates hooks with config, passes nothing to executors

## The "Stateless" Confusion

I was wrong - executors maintain no state between calls, but that's fine. They're functions, not services.

## Config Distribution Options

**Option 1: Executor Factory** (Current hooks pattern)
```typescript
const fsOps = new FsOpsExecutor({ guard: fsGuardConfig });
executors.set('read_file', (action) => fsOps.execute(action));
```

**Option 2: Context Parameter**
```typescript
executeFileOperation(action, { security: securityConfig })
```

**Option 3: Global Config Registry**
```typescript
// In orch
ConfigRegistry.set('fs-guard', config);
// In fs-ops
const config = ConfigRegistry.get('fs-guard');
```

## Recommendation

**Option 1** is cleanest - orch instantiates fs-guard, passes to fs-ops constructor. This matches the hooks pattern and keeps config flow explicit. The "mess" is that fs-ops/exec were designed before configuration needs existed.

The real question: Should fs-guard config live in `slupe.yml` alongside hooks? If yes, orch needs to parse and distribute all configs at startup.


> Should fs-guard config live in slupe.yml alongside hooks? If yes, orch needs to parse and distribute all configs at startup.

> yes, right?  seems like a mess to have multiple config files.  wdyt


Yes, single config file. Multiple files = configuration sprawl, discovery problems, sync issues.

## Config Structure in slupe.yml

```yaml
version: 1

hooks:
  before: []
  after: []

fs-guard:
  mode: allowlist  # or denylist
  allowed:
    - "./**"
    - "/tmp/slupe-**"
  denied: []
  followSymlinks: false

# Future sections:
# exec-guard:
#   languages: [python, javascript]
#   timeout: 30000
```

## Implementation Path

1. **Extend slupe.yml parsing** - orch already loads it for hooks
2. **Pass to executors at construction** - orch instantiates fs-ops with fs-guard config
3. **fs-guard as fs-ops dependency** - fs-ops constructor creates guard instance

## Critical Issue

Current orch dynamically imports executors on-demand. With config, needs upfront instantiation:

```typescript
// Current: lazy loading
if (!loadedExecutors[executor]) {
  const module = await executorModules[executor]();
}

// Needed: eager instantiation with config
const fsOps = new FsOpsExecutor({ 
  guard: config['fs-guard'] 
});
```

This breaks the lazy-loading pattern. Worth it for cleaner config flow.

------------------------


## Config Architecture Refactor Guide

### Core Problem
Current executors are stateless functions with no config injection point. Need to enable per-component configuration while maintaining clean separation of concerns.

### Design Decisions

1. **Mandatory fs-guard** - No opt-out. Simpler mental model, security by default
2. **Single config file** - `slupe.yml` contains all component configs
3. **Executor classes** - Replace function exports with classes that accept dependencies
4. **Eager instantiation** - Load all executors upfront with config, abandon lazy loading

### Implementation Steps

#### 1. Define Config Types
Create `/proj/comp/orch/src/types.ts`:
```typescript
export interface SlupeConfig {
  version: number;
  hooks?: HooksConfig;
  'fs-guard'?: FsGuardConfig;
  'exec-guard'?: ExecGuardConfig; // future
}

export interface FsGuardConfig {
  allowed?: string[];
  denied?: string[];
  followSymlinks?: boolean;
}
```

#### 2. Create FsGuard Component
Create `/proj/comp/fs-guard/src/types.ts`:
```typescript
export interface GuardCheckResult {
  allowed: boolean;
  reason?: string;
}
```

Create `/proj/comp/fs-guard/src/FsGuard.ts`:
```typescript
export class FsGuard {
  constructor(private config: FsGuardConfig, private repoRoot: string) {}
  
  async check(action: SlupeAction): Promise<GuardCheckResult> {
    // Extract paths based on action type
    // Canonicalize paths
    // Check against rules with most-specific-wins
  }
}
```

#### 3. Convert fs-ops to Class
Modify `/proj/comp/fs-ops/src/index.ts`:
```typescript
export class FsOpsExecutor {
  private handlers: Map<string, (action: SlupeAction) => Promise<FileOpResult>>;
  
  constructor(private guard: FsGuard) {
    this.handlers = new Map([
      ['write_file', this.handleFileWrite.bind(this)],
      ['read_file', this.handleFileRead.bind(this)],
      // ... move all existing handlers here
    ]);
  }
  
  async execute(action: SlupeAction): Promise<FileOpResult> {
    const guardResult = await this.guard.check(action);
    if (!guardResult.allowed) {
      return {
        success: false,
        error: `fs-guard: ${guardResult.reason}`
      };
    }
    
    const handler = this.handlers.get(action.action);
    if (!handler) {
      return {
        success: false,
        error: `Unknown action: ${action.action}`
      };
    }
    
    return handler(action);
  }
  
  // Move existing handler functions as private methods
  private async handleFileWrite(action: SlupeAction): Promise<FileOpResult> {
    // Existing handleFileWrite code
  }
}

// Keep backward compatibility export for tests
export async function executeFileOperation(action: SlupeAction): Promise<FileOpResult> {
  throw new Error('Direct function call deprecated. Use FsOpsExecutor class.');
}
```

#### 4. Convert exec to Class
Similar pattern for `/proj/comp/exec/src/index.ts`:
```typescript
export class ExecExecutor {
  constructor(/* future: execGuard */) {}
  
  async execute(action: SlupeAction): Promise<FileOpResult> {
    // Move executeCommand logic here
  }
}
```

#### 5. Create Config Loader
Create `/proj/comp/orch/src/loadConfig.ts`:
```typescript
export async function loadConfig(repoPath: string): Promise<SlupeConfig> {
  const configPath = join(repoPath, 'slupe.yml');
  
  try {
    const content = await readFile(configPath, 'utf8');
    const config = loadYaml(content) as SlupeConfig;
    
    // Validate config structure
    if (!config.version) {
      throw new Error('Config missing version');
    }
    
    return config;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Return default config
      return {
        version: 1,
        'fs-guard': {
          allowed: [`${repoPath}/**`],
          denied: ['/**']
        }
      };
    }
    throw error;
  }
}
```

#### 6. Refactor Orchestrator
Modify `/proj/comp/orch/src/index.ts`:
```typescript
export class Slupe {
  private executors: Map<string, (action: SlupeAction) => Promise<FileOpResult>>;
  private config: SlupeConfig;
  
  constructor(options: SlupeOptions = {}) {
    this.options = {
      repoPath: options.repoPath || process.cwd(),
      // ...
    };
  }
  
  async execute(llmOutput: string): Promise<ExecutionResult> {
    // Initialize executors on first use
    if (!this.executors) {
      await this.initializeExecutors();
    }
    
    // Rest of existing execute logic
  }
  
  private async initializeExecutors(): Promise<void> {
    // Load config
    this.config = await loadConfig(this.options.repoPath!);
    
    // Initialize hooks if enabled
    if (this.options.enableHooks) {
      // Existing hooks initialization, using this.config.hooks
    }
    
    // Create fs-guard
    const fsGuard = new FsGuard(
      this.config['fs-guard'] || {
        allowed: [`${this.options.repoPath}/**`],
        denied: ['/**']
      },
      this.options.repoPath!
    );
    
    // Create executors
    const fsOps = new FsOpsExecutor(fsGuard);
    const exec = new ExecExecutor();
    
    // Build routing table from unified-design.yaml
    this.executors = new Map();
    const design = await this.loadUnifiedDesign();
    
    for (const [actionName, actionDef] of Object.entries(design.tools)) {
      const executorName = (actionDef as any).executor;
      
      switch (executorName) {
        case 'fs-ops':
          this.executors.set(actionName, (action) => fsOps.execute(action));
          break;
        case 'exec':
          this.executors.set(actionName, (action) => exec.execute(action));
          break;
        // Future executors...
      }
    }
  }
}
```

#### 7. Update Tests
Tests need to construct executors with guards:
```typescript
// fs-ops tests
const guard = new FsGuard({ allowed: ['test/**'] }, '/test/root');
const executor = new FsOpsExecutor(guard);
const result = await executor.execute(action);
```

### Rationale

**Why classes over functions**: Dependency injection requires construction-time config. Functions can't hold state cleanly.

**Why eager loading**: Config validation should fail fast. Memory cost negligible for ~10 executors.

**Why fs-guard mandatory**: Optional security is no security. Tests can use permissive guards.

**Why single config file**: Multiple configs = synchronization bugs. One source of truth.

### Migration Risk

Breaking changes to all executor interfaces. But no production users yet, so now is the time.