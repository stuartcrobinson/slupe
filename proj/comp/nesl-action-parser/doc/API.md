# Component: nesl-action-parser

## Component Type
standard

## Documentation Debt
[Must be empty before implementation]

## Dependencies
[Updated via STOP protocol - implementation complete]

```yaml
dependencies:
  external/nesl-js:
    functions: [parseNesl]
    types: [Block, ParseResult as NeslParseResult]
  
  external/js-yaml:
    functions: [load as loadYaml]
    types: []
  
  node:fs/promises:
    functions: [readFile]
    types: []
  
  node:path:
    functions: [dirname, join]
    types: []
    
  node:url:
    functions: [fileURLToPath]
    types: []
```

## Exports
```yaml
exports:
  functions: [parseNeslResponse, validateNeslBlock, transformToAction, clearActionSchemaCache]
  types: [ParseResult, SlupeAction, ParseError, ValidationResult, TransformError]
  errors: [TransformError]
```

### parseNeslResponse
- **Signature**: `parseNeslResponse(neslText: string) -> Promise<ParseResult>`
- **Purpose**: Parse NESL blocks from text into validated slupe actions.
- **Test-data**: `test-data/parseNeslResponse.json`

### validateNeslBlock
- **Signature**: `validateNeslBlock(block: NeslBlock, actionSchema: ActionDefinition) -> ValidationResult`
- **Purpose**: Validate a single NESL block against action schema.
- **Test-data**: `test-data/validateNeslBlock.json`

### transformToAction
- **Signature**: `transformToAction(block: NeslBlock, actionDef: ActionDefinition) -> SlupeAction`
- **Purpose**: Transform validated NESL block into typed slupe action.
- **Throws**: `TransformError` when type conversion fails
- **Test-data**: `test-data/transformToAction.json`

### clearActionSchemaCache
- **Signature**: `clearActionSchemaCache() -> void`
- **Purpose**: Clear cached action schema to force reload on next parse.
- **Test-data**: None (utility function for testing)

## Internal Functions
[Discovered during implementation - not exported]

### loadActionSchema
- **Signature**: `loadActionSchema() -> Promise<Map<string, ActionDefinition>>`
- **Purpose**: Load and parse unified-design.yaml action definitions with 5s timeout.

### reconstructNeslBlock
- **Signature**: `reconstructNeslBlock(block: Block) -> string`
- **Purpose**: Recreate NESL syntax from parsed block for error context.

### parseBoolean (in transformToAction.ts)
- **Signature**: `parseBoolean(value: string) -> boolean`
- **Purpose**: Convert string "true"/"false" to boolean.

### parseInteger (in transformToAction.ts)
- **Signature**: `parseInteger(value: string) -> number`
- **Purpose**: Convert numeric string to integer.
- **Throws**: `TransformError` when not a valid integer

### validateAbsolutePath (in transformToAction.ts)
- **Signature**: `validateAbsolutePath(path: string) -> boolean`
- **Purpose**: Check if string is valid absolute path.

## Types

### ParseResult
```typescript
{
  actions: SlupeAction[]      // Successfully parsed actions
  errors: ParseError[]        // All errors encountered
  summary: {
    totalBlocks: number
    successCount: number
    errorCount: number
  }
}
```

### SlupeAction
```typescript
{
  action: string              // Action name from unified-design
  parameters: Record<string, any>  // Typed parameters
  metadata: {
    blockId: string          // NESL block ID
    startLine: number
    endLine: number
  }
}
```

### ParseError
```typescript
{
  blockId: string            // Which NESL block failed
  action?: string            // Action type if identified
  errorType: 'syntax' | 'validation' | 'type'
  message: string            // Specific error details
  blockStartLine?: number    // Starting line of the NESL block
  neslContent?: string       // Original NESL block for context
}
```

### ValidationResult
```typescript
{
  valid: boolean
  actionType?: string        // Identified action if valid
  errors?: string[]          // Validation errors if invalid
}
```

### TransformError
```typescript
class TransformError extends Error {
  parameterName: string
  expectedType: string
  actualValue: string
}
```

### ActionDefinition
```typescript
{
  type: 'read' | 'write' | 'meta' | 'git' | 'dynamic'
  description: string
  parameters: Record<string, ParameterDef>
  returns: Record<string, any>
}
```

### ParameterDef
```typescript
{
  type: string              // 'string' | 'integer' | 'boolean' | 'enum'
  required: boolean
  format?: string           // e.g. 'absolute_path'
  values?: string[]         // for enum type
  default?: any
}
```