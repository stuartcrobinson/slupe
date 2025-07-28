# XD5 LLM Quick Reference

## Core Principle
Documentation maintains dependency graphs for deterministic context assembly. Initial dependencies are hypotheses - implementation discovers reality. The STOP protocol ensures documentation evolves to match actual dependencies.

## File Structure
```
<repo>/
└── proj/
    ├── doc/
    │   ├── API.md        # ⚠️ CRITICAL: All dependencies + exports
    │   ├── ABSTRACT.md   # 60-word purpose + 300-word overview + brief spec in EARS format (The Easy Approach to Requirements Syntax)
    │   └── ARCH.md       # Technical decisions, constraints
    ├── test-data/        # Test cases as JSON/MD files
    │   ├── unit/         # Unit test data
    │   └── integration/  # Integration test data
    ├── test/             # Minimal harnesses loading test-data
    │   ├── unit/         # Unit test harnesses
    │   └── integration/  # Integration test harnesses
    ├── test-intn/        # Integration tests for dependencies
    ├── src/              # Implementation
    └── comp/             # Sub-components (recursive) - do not need 'proj' dirs
```

## API.md Template
```markdown
# Component: {name}

## Component Type
standard | types-only

## Dependencies
[Provisional - updated via STOP protocol when implementation reveals actual needs]

Mark internal component status: [PLANNED], [IN-PROGRESS], or [IMPLEMENTED]
External dependencies do not need status markers.

```yaml
dependencies:
  # Initial hypothesis based on design
  proj/comp/payment:                                       # [PLANNED]
    functions: [validateCard, processRefund] # may change 
    types: [PaymentResult, CardType]
    errors: [PaymentError]
  
  proj/comp/auth:                                          # [IMPLEMENTED]
    functions: [checkPermission, validateToken]
    types: [User, TokenPayload]
  
  proj/comp/logger:                                        # [IN-PROGRESS]
    functions: [logTransaction]  # Audit requirement
  
  proj/comp/payment-types: "*"  # Wildcard for types-only  # [IMPLEMENTED] 
  
  external/lodash:
    functions: [groupBy, mapValues]
  
  external/@stripe/stripe-js:
    types: [Stripe, PaymentIntent]
    functions: [loadStripe]
```

## Exports
[Structured YAML for dependency graph tooling, then prose descriptions]

```yaml
exports:
  functions: [functionName1, functionName2]
  types: [Type1, Type2, Type3]
  classes:
    ClassName:
      methods: [method1, method2]
  errors: [CustomError1, CustomError2]
```

### {functionName}
- **Signature**: `{functionName}(param: Type) -> ReturnType`
- **Purpose**: Single sentence.
- **Throws**: `{ErrorType}` when {condition}
- **Test-data**: `test-data/{path}/{functionName}.json` [PLANNED|IMPLEMENTED]



## Workflow

### Core Flow: Design → Test → Implement

1. **Write docs**: ABSTRACT.md → ARCH.md → API.md (provisional)
2. **Design tests**: E2E hypothesis → Decompose → Unit tests  
3. **Implement**: Discover real dependencies → Update docs → Complete code

### Test Authority & Evolution

**Tests Are Source of Truth (But Not Infallible)**
- Tests define what code SHOULD do
- During debug: ALWAYS fix code to match tests first
- Test errors discovered? Ask human: "I believe test X is incorrect because Y. Should I update it?"
- NEVER auto-modify tests while debugging
- Each test change needs explicit approval

### Detailed Flow

1. **E2E Test Hypothesis** - Write component test-data (expect evolution)
2. **Pseudocode** - Rough implementation to discover structure
3. **Extract Functions** - Identify & extract all pure functions
4. **Unit Tests** - Write test-data for each function
5. **Implement Functions** - Red/green/debug (fix code, not tests)
6. **Revise E2E Tests** - Align with discovered behavior (ask human)
7. **Wire Component** - Connect tested functions
8. **Debug E2E** - Fix code until green

**Debug Protocol**: Test fails? → Try fixing code → Still failing? → Consider test error → Request human approval for any test change

**If docs are wrong**: STOP → Update docs → Update tests → Continue



### Critical Implementation Rules

**Initial Docs Are Hypotheses**: 
- First API.md contains best guesses
- Dependencies WILL be wrong
- This is expected and healthy
- Discovery through implementation is the goal

**🛑 STOP Protocol**: When implementation reveals doc errors:
1. STOP immediately
2. Update API.md/ARCH.md
3. Continue with correct docs

**Test Immutability**: 
- Test harnesses = frozen after creation
- Test data = only change with human approval
- Fix code, not tests (unless explicitly approved)

**Dependency Updates**:
- Add to API.md as discovered
- Include transitive deps if needed for understanding
- External deps must be explicit

## Test Data Format
```json
{
  "cases": [
    {
      "name": "descriptive name",
      "input": [arg1, arg2],
      "expected": {result},
      "throws": "ErrorType"  // optional
    }
  ]
}
```

## Quick Checks

Before implementing:
- [ ] API.md declares all exports?
- [ ] Dependencies section updated?
- [ ] Test data files created?

During implementation:
- [ ] Tests fail first (red phase)?
- [ ] Docs match reality? (if not → STOP)
- [ ] All imports declared in API.md?

## Common Patterns

**Extract pure functions during pseudocode**:
```javascript
// Pseudocode reveals:
// extractedFn: validateInput(x) -> bool
// extractedFn: processData(data) -> result
```

**Types-only components**: No test/ or src/, only doc/

**Path conventions**: All relative to `<repo>/`
- Component: `proj/comp/{name}`
- Nested: `proj/comp/{parent}/comp/{child}`


# update 

- need to update this so that we save our pseudocde in some sort of documetnation, maybe temp documentation.  so if we implement the fucntiosn to unit test, we dont get confused later about how theyre supposed to be used.

- ideally, each extracted function unit-testable function would be in its own file.  for parallelism with the unit test files

- TESTING PATHS

dont save files directly to `/tmp/`.  save them to a dir in the tmp dir taht is named with the name of the test preceedd by 't_', eg `/tmp/t_move-nonexistent-file`

like: 


### 003-move-nonexistent-file

```sh nesl
#!nesl [@three-char-SHA-256: mnf]
action = "file_move"
old_path = "/tmp/t_move-nonexistent-file/ghost.txt"
new_path = "/tmp/t_move-nonexistent-file/nowhere.txt"
#!end_mnf
```

```json
{
  "success": false,
  "error": "file_move: Source file not found '/tmp/t_move-nonexistent-file/ghost.txt' (ENOENT)"
}
```



consider using EARS somehow for specs/reqs: EARS: The Easy Approach to Requirements Syntax

for dependency blocks in docs api, do not include external dependencies!!