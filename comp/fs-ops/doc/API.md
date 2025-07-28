# Component: fs-ops

## Component Type
standard

## Status
[IMPLEMENTED] - All file operations (write, read, delete, move, replace_text, replace_all_text, files_read)
[NOT IMPLEMENTED] - Directory operations (dir_create, dir_delete, ls), search operations (grep, glob)

## Documentation Debt
- [ ] Integration test format is preliminary [IMPLEMENTED]
- [ ] Error handling strategy needs refinement
- [ ] Consider batching operations for efficiency

## Dependencies

[Updated via STOP protocol - initial hypothesis proved mostly correct]

```yaml
dependencies:
  node:fs/promises:
    functions: [writeFile, unlink, mkdir, rename, stat, readFile]
    
  node:path:
    functions: [dirname]
    # Note: removed unused - resolve, join (not yet needed)
    
  # Removed node:util - not used
  # Removed node:child_process - grep not yet implemented
```

## Exports

```yaml
exports:
  functions: [executeFileOperation]
  types: [FileOpResult]
  classes:
    FileOpError:
      extends: Error
```

### executeFileOperation
- **Signature**: `executeFileOperation(action: SlupeAction) -> Promise<FileOpResult>`
- **Purpose**: Execute file system operations from parsed NESL actions
- **Throws**: Never - all errors captured in FileOpResult
- **Test-data**: `test-data/integration/*.cases.md` [IMPLEMENTED]

### FileOpResult (type)
```typescript
interface FileOpResult {
  success: boolean
  data?: any           // Operation-specific return data
  error?: string       // Error message if failed
}
```

### FileOpError (type)
```typescript
interface FileOpError extends Error {
  code: string         // e.g., 'ENOENT', 'EACCES'
  path?: string        // File path involved
  operation: string    // Which operation failed
}
```

## Internal Functions

### createFile
- **Signature**: `createFile(path: string, content: string) -> Promise<void>`
- **Purpose**: Create new file with content, creating parent directories as needed

### writeFile  
- **Signature**: `writeFile(path: string, content: string) -> Promise<void>`
- **Purpose**: Overwrite existing file content

### replaceText
- **Signature**: `replaceText(content: string, oldText: string, newText: string, count?: number) -> {result: string, replacements: number}`
- **Purpose**: Pure function to replace text occurrences in string content
- **Throws**: Error when oldText is empty string
- **Behavior**: Replaces up to `count` occurrences (all if count undefined)

### deleteFile
- **Signature**: `deleteFile(path: string) -> Promise<void>`
- **Purpose**: Remove file

### moveFile
- **Signature**: `moveFile(oldPath: string, newPath: string) -> Promise<void>`
- **Purpose**: Move or rename file

### readFileContent
- **Signature**: `readFileContent(path: string) -> Promise<string>`
- **Purpose**: Read file content as UTF-8 string

### createDirectory
- **Signature**: `createDirectory(path: string) -> Promise<void>`
- **Purpose**: Create directory, including parent directories

### deleteDirectory
- **Signature**: `deleteDirectory(path: string) -> Promise<void>`
- **Purpose**: Remove directory (must be empty)

### listDirectory
- **Signature**: `listDirectory(path: string) -> Promise<DirEntry[]>`
- **Purpose**: List directory contents with metadata

### searchFiles
- **Signature**: `searchFiles(pattern: string, path: string, include?: string) -> Promise<GrepResult[]>`
- **Purpose**: Search for pattern in files (grep-like)

### globFiles
- **Signature**: `globFiles(pattern: string, basePath: string) -> Promise<string[]>`
- **Purpose**: Find files matching glob pattern

### extractNumberedLines
- **Signature**: `extractNumberedLines(content: string, lineSpec: string, delimiter: string) -> { result: string, lineCount: number }`
- **Purpose**: Pure function to extract and number specific lines from content
- **Parameters**:
  - `content`: Full file content
  - `lineSpec`: Line specification ("4" for single line, "23-43" for range)
  - `delimiter`: Delimiter between line number and content
- **Returns**: Object with numbered lines and total line count
- **Throws**: Error for invalid line specifications

### handleFileReadNumbered
- **Signature**: `handleFileReadNumbered(action: SlupeAction) -> Promise<FileOpResult>`
- **Purpose**: Read file content with line numbers for specified line range
- **Parameters**: 
  - `path`: File path to read
  - `lines`: Line range string ("23-43") or single line ("4")
  - `delimiter`: Optional delimiter between line number and content (default: ": ")
- **Returns**: FileOpResult with numbered content
- **Test-data**: `test-data/integration/file_read_numbered.cases.md` [IMPLEMENTED]

## Action Mapping

```typescript
const actionHandlers = {
  // Implemented
  'file_write': handleFileWrite,
  'file_replace_text': handleFileReplaceText,
  'file_replace_all_text': handleFileReplaceAllText,
  'file_delete': handleFileDelete,
  'file_move': handleFileMove,
  'file_read': handleFileRead,
  'files_read': handleFilesRead,
  'file_read_numbered': handleFileReadNumbered,
  
  // Not implemented
  'dir_create': async (action) => ({ success: false, error: 'Not implemented' }),
  'dir_delete': async (action) => ({ success: false, error: 'Not implemented' }),
  'ls': async (action) => ({ success: false, error: 'Action not implemented: ls' }),
  'grep': async (action) => ({ success: false, error: 'Not implemented' }),
  'glob': async (action) => ({ success: false, error: 'Not implemented' })
}
```