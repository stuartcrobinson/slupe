## Complete Change Set

### 1. Create Config Component
```
proj/comp/config/
├── src/
│   ├── index.ts         // exports: loadConfig, createConfig, configExists
│   ├── load.ts          // move from orch/src/loadConfig.ts
│   ├── create.ts        // move from orch/src/createStarterConfig.ts
│   ├── types.ts         // move SlupeConfig from orch/src/types.ts
│   └── validate.ts      // new - config validation
```

### 2. Clean HooksManager
- Delete `loadAndSetConfig()` method
- Delete `parseYamlConfig.ts` and `validateConfig.ts` files
- Remove yaml/file handling imports
- Keep only execution logic

### 3. Implement Async Factory in Slupe
```typescript
class Slupe {
  private constructor(
    private config: SlupeConfig,
    private executors: Map<string, Executor>,
    private hooksManager?: HooksManager,
    private repoPath: string
  ) {}

  static async create(options: SlupeOptions): Promise<Slupe> {
    const repoPath = options.repoPath || process.cwd();
    const config = await loadConfig(repoPath);
    const executors = await Slupe.initializeExecutors(config, repoPath);
    const hooksManager = config.hooks 
      ? new HooksManager(config.hooks, config.vars, repoPath)
      : undefined;
    return new Slupe(config, executors, hooksManager, repoPath);
  }

  async execute(llmOutput: string): Promise<ExecutionResult> {
    // Remove all config/hooks initialization
    // Just run with pre-initialized components
  }
}
```

### 4. Remove Config Creation from Runtime
- Delete `createConfigIfMissing` from SlupeOptions
- Delete `configCreated` from ExecutionResult  
- Delete entire `initializeHooks()` method
- Remove config creation logic everywhere

### 5. Fix Comments/Docs
- Remove "non-fatal" comments from after hook error handling
- Update ARCH.md to state both hook types cause execution failure
- Document that `continueOnError` only affects next command, not overall result

### 6. Update Tests
```typescript
// Old
const slupe = new Slupe({ repoPath, hooks: undefined });

// New  
const slupe = await Slupe.create({ repoPath });
```

**Note**: `continueOnError` controls flow within hook sequence. Any hook error (unless `continueOnError: true`) makes overall execution fail. This is correct.


## Config Refactoring Implementation Guide

### Core Changes

1. **Extract Config Management**
   - Create new `proj/comp/config` component
   - Move all config loading/validation from `orch` and `hooks`
   - Single responsibility: load and validate `slupe.yml`

2. **Async Factory Pattern for Slupe**
   - Replace `new Slupe()` with `await Slupe.create()`
   - Pre-initialize all dependencies before construction
   - No lazy loading during execution

3. **Simplify HooksManager**
   - Remove file I/O capabilities
   - Accept config in constructor only
   - Pure execution component

4. **Remove Runtime Config Creation**
   - No `createConfigIfMissing` option
   - Config must exist or initialization fails
   - Explicit error propagation

### Implementation Details

#### Error Handling Strategy
- Let initialization errors throw naturally
- Callers must try/catch `Slupe.create()`
- No error recovery or defaults - fail fast

#### Config Validation
- Validate during load in config component
- Throw descriptive errors for invalid schemas
- No runtime validation needed

#### Hooks Initialization Fix
```typescript
const hooksManager = options.enableHooks !== false && config.hooks 
  ? new HooksManager(config.hooks, config.vars, repoPath)
  : undefined;
```

#### Breaking Changes
- All `new Slupe()` calls must become `await Slupe.create()`
- `ExecutionResult.configCreated` field removed
- `SlupeOptions.createConfigIfMissing` removed

### Files to Modify/Create

**Create:**
- `proj/comp/config/src/index.ts`
- `proj/comp/config/src/load.ts`
- `proj/comp/config/src/create.ts`
- `proj/comp/config/src/types.ts`
- `proj/comp/config/src/validate.ts`
- `proj/comp/config/test/unit/load.test.ts`
- `proj/comp/config/test/unit/create.test.ts`
- `proj/comp/config/test/unit/validate.test.ts`

**Move/Delete:**
- `proj/comp/orch/src/loadConfig.ts` → `proj/comp/config/src/load.ts`
- `proj/comp/orch/src/createStarterConfig.ts` → `proj/comp/config/src/create.ts`
- `proj/comp/orch/src/types.ts` → Extract `SlupeConfig` to `proj/comp/config/src/types.ts`
- `proj/comp/hooks/src/parseYamlConfig.ts` → Delete
- `proj/comp/hooks/src/validateConfig.ts` → Delete

**Modify:**
- `proj/comp/orch/src/index.ts` - Implement async factory
- `proj/comp/hooks/src/index.ts` - Remove `loadAndSetConfig` method
- `proj/comp/hooks/test/integration/git-integration.test.ts` - Update to async factory
- `proj/comp/hooks/test/integration/hooks-basic.test.ts` - Remove config loading tests
- `proj/comp/hooks/test/integration/hooks-abort.test.ts` - Update to async factory
- `proj/comp/orch/doc/ARCH.md` - Document fatal hook behavior

**Review for updates:**
- Any other test files that instantiate `Slupe`
- Any documentation mentioning config creation behavior