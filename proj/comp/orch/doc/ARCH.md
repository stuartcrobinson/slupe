# Slupe Architecture


IMPORTANT TOOL TESTING NOTES:

- for test specific slupe tools, each tool must get its own test case file, for easy visibility into which tools have been implemented and tested yet.
- aka `proj/comp/fs-ops/test-data/integration/file_delete.cases.md`

## Core Design Decisions

### Transaction Model
- **No automatic rollback** - All operations commit, including failures
- **Failures are data** - LLM needs failure feedback for next steps
- **Forward-only progress** - Cheaper than regenerating responses
- **Manual rollback only** - Human-initiated via git commands
- **Boundary**: One git commit per `execute()` call
- **API**: Explicit transaction management (details TBD)

### NESL Processing Pipeline
1. NESL parser (external npm) → AST
2. AST → Action objects (nesl-ast-converter)
3. Actions → Execution → Results

### NESL AST Structure
```typescript
interface NeslParseResult {
  blocks: NeslBlock[]
  errors: NeslError[]
}

interface NeslBlock {
  id: string           // 3-char SHA-256
  properties: {
    action: string     // Maps to tool name (e.g., "file_write")
    [key: string]: any // Tool-specific parameters
  }
  startLine: number
  endLine: number
}

interface NeslError {
  code: string         // e.g., "DUPLICATE_KEY"
  line: number
  column: number
  length: number
  blockId: string
  content: string
  context: string
  message: string
}
```

### Error Propagation Strategy
- **Parser errors**: Skip blocks with parser errors, execute valid blocks only
- **Validation errors**: Skip invalid actions, execute valid ones
- **Execution errors**: Continue with remaining actions
- **Result**: Complete execution log with successes and failures

### Action Mapping
- NESL `action` property maps directly to tool names from unified-design.yaml
- Use canonical names: `file_write`, `exec`, etc.

### Context Management
- **V1**: Simple `Set<string>` of file paths
- **Storage**: In-memory only, no persistence across sessions
- **V2 Future**: Sub-file references (lines, functions, sections)

### Hooks Integration
- **Loading**: Lazy-load HooksManager on first execute() if hooks enabled
- **Config Source**: Options > slupe.yml > no hooks
- **Before Hook Failure**: Fatal - prevents NESL execution
- **After Hook Failure**: Fatal - affects overall execution success
- **Context Passing**: Minimal context to after hooks (success, counts)
- **Variable Interpolation**: Handled by hooks component, not orch

### Execution Model
- **Synchronous**: All operations block until complete
- **CWD Management**: Session-based working directory
  - Default: Repository root
  - Each exec can override with `cwd` parameter
  - CWD persists within session, not across transactions
- **Results Format**: Flat array with sequence numbers
```typescript
interface ActionResult {
  seq: number          // Execution order
  blockId: string      // NESL block ID
  action: string       // Action type
  params: any          // Input parameters
  success: boolean
  error?: string       // Error message if failed
  data?: any           // Action-specific output (stdout, content, etc.)
}
```

### Security Model (V1)
- **None**: Full filesystem access
- **No validation**: Any path allowed
- **No sandboxing**: Direct execution
- **V2 Future**: Path allowlisting per unified-design.yaml. FOR THIS REASON all fs stuff should immediately be implemented using our fs wrapper functions so this whitelisting/blacklisting is easy to implment in the future.

## Component Structure
```
slupe/
├── proj/
│   ├── comp/
│   │   ├── nesl-ast-converter/  # AST → Actions
│   │   ├── fs-ops/              # File/directory operations
│   │   ├── exec/                # Command execution
│   │   ├── git-tx/              # Git transaction management
│   │   └── context/             # Working set management
│   └── doc/
│       ├── API.md               # Main orchestrator API
│       ├── ARCH.md              # This document
│       └── ABSTRACT.md          # Project overview
```

## Implementation Priorities
1. `nesl-ast-converter` - Cannot test without this
2. `fs-ops` - Core functionality
3. `exec` - Command execution
4. `git-tx` - Transaction wrapper
5. `context` - Working set (may be simple enough to inline)

## Open Questions

### Critical
1. **NESL parser package**: `nesl-js` from `github:nesl-lang/nesl-js`
   - Import: `const { parseNESL } = require('nesl')`
2. **Transaction API**: Single `execute()` method processes NESL block array

### Design
1. **Parser error handling**: Execute blocks with parser errors or skip?
2. **Git conflict handling**: How to handle conflicts during manual rollback?
3. **Concurrent access**: Multiple slupe instances on same repo?
4. **Partial failure behavior**: Continue executing after first failure or abort?

### Future
1. **Context references**: Syntax for line ranges and functions
2. **Execution isolation**: Container/VM strategy for V2
3. **Streaming results**: Return results as actions complete or batch at end?

## Design Rationale

### Why No Automatic Rollback
Traditional transaction systems rollback on failure to maintain consistency. Slupe explicitly rejects this because:
1. **LLM responses are expensive** - Regenerating costs time and money
2. **Partial success is informative** - LLM learns from failures
3. **Git preserves history** - Can always manually revert
4. **Forward progress over perfection** - Incremental improvement model

### Why Synchronous Execution
1. **Deterministic results** - LLM needs to know exact outcomes
2. **Sequential dependencies** - Later actions may depend on earlier ones
3. **Simpler implementation** - No async state management
4. **Git compatibility** - Git operations are inherently synchronous

### Why In-Memory Context
1. **Session isolation** - Each LLM conversation is independent
2. **No persistence complexity** - No file format versioning
3. **Git is the source of truth** - Files on disk matter, not context
4. **Quick reset** - New session = clean slate