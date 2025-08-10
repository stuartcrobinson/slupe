# Structure Operations Targeting Design Document

## Core Concept

Hybrid targeting system: AST-based scope validation with text-based matching. Allows targeting both semantic structures (functions, classes) and arbitrary lines within them.

## Structure Definition

A **structure** is either:
1. **Block structure**: AST node representing a semantic unit (function, class, if-statement, etc.)
2. **Line structure**: Single line of code within an AST node that doesn't start a block

### Block Structure Returns
- First line is a block starter (function/class/control flow declaration)
- Returns entire AST node including decorators, comments, body

### Line Structure Returns  
- Any complete line that isn't a block starter (partial lines not targetable)
- Returns exactly that single line with all whitespace preserved

## Target Format

Multi-line string where each line represents a hierarchical path element:
```
ParentStructure
ChildStructure  
TargetLine
```

- Empty string `""` targets file/module scope
- Each line attempts to match using the cascade algorithm below

## Matching Cascade Algorithm

Six-phase progression with increasing normalization and leniency:

### Phase 1: NORM_WHITE & REMOVE_TRAILING
1. Remove all spaces/tabs from target and candidate lines
2. Remove trailing `{` or `:` if present
3. Attempt exact match with strict parent hierarchy
4. If no matches → Allow SKIP_PARENTS (any ancestor path valid)

### Phase 2: REMOVE_STRUCT
1. Reset to strict parent hierarchy
2. Remove leading and trailing structural chars `{};/\:` from normalized strings (preserve internal)
3. Attempt exact match
4. If no matches → Allow SKIP_PARENTS

### Phase 3: STARTS_WITH
1. Reset to strict parent hierarchy  
2. Check if candidate line starts with target string (using normalized versions)
3. Attempt match
4. If no matches → Allow SKIP_PARENTS
5. If still no matches → Return empty results

## Normalization Rules

- **Preserved characters**: `()[]` and all semantic keywords (public, private, static, async, const, let, function, class, etc.)
- **Removed for matching**: Whitespace, then leading/trailing structural punctuation `{};/\:` progressively
- **Matching requirement**: After normalization, entire line must match (not just subset)
- **Return text**: Always original source with exact whitespace/formatting

## Parent Skipping Semantics

When SKIP_PARENTS active:
- Can skip any number of intermediate hierarchy levels
- `GrandParent\nChild` matches Child anywhere within GrandParent
- Validates only that each parent exists in ancestry chain (order preserved)

## Special Cases

### else/elif Handling
- Treated as children of nearest `if` regardless of AST representation
- Allows `if\nelif` and `if\nelse` targeting

### Comments
- Targetable as line structures
- Inline comments part of their line
- Standalone comment lines are separate structures

### Invalid Targets
- Empty lines not targetable
- Partial lines not targetable (must be complete line from source)
- Lines containing only structural punctuation (`}`, `{`) are targetable but rarely useful

### Decorators/Annotations
- Included in block structure boundaries
- Not independently targetable

### Multi-line Declarations
- Only first line used for matching
- Entire declaration returned if matched

## Return Behavior

### read_structure
- Returns ALL matches found
- Each match includes full structure boundaries

### Other Operations  
- Multiple matches → `TARGET_AMBIGUOUS` error
- Single match → Operation proceeds

## Error Messages

### TARGET_NOT_FOUND
Include: "No match found. Ensure target uses exact literal text of first line of declaration or full line of code"

### TARGET_AMBIGUOUS
Include list of all matching locations

## Examples

### Block Structure
```javascript
class Builder {
  build() { return this; }
}
```
Target: `Builder\nbuild`
Returns: `build() { return this; }`

### Line Structure  
```javascript
return this
  .step1()
  .step2();
```
Target: `.step1()`
Returns: `  .step1()` (with leading spaces)

### With Parent Skipping
```javascript
class Service {
  async process() {
    if (condition) {
      validate();
    }
  }
}
```
Target: `Service\nvalidate();` (skipping `process` and `if`)
Returns: `      validate();` (if SKIP_PARENTS active in cascade)

## Implementation Notes

- Each cascade phase requires full file traversal
- Normalization applied temporarily for matching only
- Original text boundaries preserved exactly
- No validation of operation semantics (LLM responsibility)