# NESL Action Parser - Architecture

## Design Philosophy

**Maximize Execution, Minimize Regeneration**: Parse and validate each NESL block independently. Execute all valid actions while collecting detailed errors for invalid ones. This avoids expensive LLM token usage for full response regeneration.

## Processing Pipeline

1. **NESL Parsing** (via nesl-js)
   - Input: Raw text with NESL blocks
   - Output: Parsed blocks with string properties
   - Preserves: Block IDs, line numbers, raw content

2. **Action Validation** (per block)
   - Validate `action` field exists and matches known slupe actions
   - Check required parameters for specific action type
   - Continue processing even if some blocks fail

3. **Type Transformation** (per valid block)
   - Convert string values to appropriate types
   - Validate constraints (path formats, enum values, etc.)
   - Preserve original NESL metadata

4. **Result Aggregation**
   - Collect all successful action objects
   - Collect all errors with context
   - Return comprehensive ParseResult

## Error Handling Strategy

Each block processed independently with errors collected in structured format:
- `blockId`: NESL block identifier
- `action`: Action type if identified before error
- `blockStartLine`: Starting line number of the NESL block in original text
- `errorType`: Category (syntax, validation, type)
- `message`: Specific error details
- `neslContent`: Original NESL block for LLM reference

### Implementation Details
- Tracks blocks with syntax errors to avoid double-processing
- Handles null/undefined from parseNesl gracefully
- 5-second timeout on unified-design.yaml loading
- Cache mechanism with clearing for tests
- Block reconstruction uses JSON.stringify for proper quote escaping

## Type Conversions

All NESL values are strings, requiring conversion:
- **Booleans**: "true"/"false" → boolean
- **Integers**: Numeric strings → number
- **Paths**: Validate absolute path format
- **Enums**: Validate against allowed values
- **Arrays**: Not supported in NESL (would need special syntax)

## Action Mapping

NESL actions map directly to slupe tool names from unified-design.yaml:
- Must use exact tool names (e.g., `file_write`, not `write_file`)
- No aliasing or fuzzy matching to avoid ambiguity

## Constraints

- NESL doesn't support complex types (objects, arrays)
- All values are strings requiring parsing
- No nested structures
- Heredoc strings preserve internal formatting
- Unified-design.yaml must be at ../../../../unified-design.yaml relative to src/
- Schema loading uses ES module URL resolution (fileURLToPath)

## Dependencies on Other Components

- Requires action schema definitions (types, required params)
- Will need shared error types with response formatter
- Path validation utilities