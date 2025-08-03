# ⛵️ Slupe - Sandboxed LLM oUtput processing engine

LLM coder 'tools' for any model

Slupe is a file system orchestration tool that enables Large Language Models (LLMs) to execute file operations through a structured markup language called NESL (Natural Expression Structured Language). It provides a secure, configurable bridge between AI assistants and your local development environment.

## Features

- **Universal LLM Compatibility**: Works with any LLM that can generate text
- **File System Operations**: Read, write, move, delete files with configurable access controls
- **Security Guards**: Configurable path-based access control with glob pattern support
- **Git Integration**: Optional hooks for automated commits and version control
- **Real-time Monitoring**: Watch files for changes and execute NESL blocks automatically
- **Clipboard Integration**: Copy outputs directly to clipboard and monitor clipboard for NESL blocks

## Installation

```bash
npm install -g slupe
```

or just 

```
npx slupe
```

Requirements:
- Node.js >= 20.0.0
- Git (optional, for version control hooks)

## Quick Start

1. Initialize Slupe in your project:
```bash
cd your-project
slupe
```

This creates:
- `slupe.yml` - Configuration file
- `slupe_input.md` - Input file for NESL commands
- `NESL_INSTRUCTIONS.md` - Instructions for LLMs

2. Edit `slupe.yml` to configure allowed actions and paths:
```yaml
allowed-actions:
  - file_read
  - file_write

fs-guard:
  allowed:
    - "./**"  # Allow all files in project
  denied:
    - "**/.git/**"  # Deny git internals
```

3. Paste NESL blocks into `slupe_input.md` and watch them execute!

## NESL Syntax

NESL blocks are markdown code blocks that LLMs can generate:

```sh nesl
#!nesl [@three-char-SHA-256: abc]
action = "file_write"
path = "/path/to/file.txt"
content = <<'EOT_abc'
Hello, World!
This is multi-line content.
EOT_abc
#!end_abc
```

## Available Actions

### File Operations
- `file_read` - Read file contents
- `file_write` - Create or overwrite files
- `file_delete` - Delete files
- `file_move` - Move or rename files
- `file_replace_text` - Replace text in files (single occurrence)
- `file_replace_all_text` - Replace all occurrences of text
- `files_replace_all_text` - Replace text across multiple files
- `files_read` - Read multiple files at once

## Configuration

### slupe.yml

```yaml
version: 1

# Security: Define allowed actions
allowed-actions:
  - file_write
  - file_read

# File system access control
fs-guard:
  allowed:
    - "./**"           # All files in project
    - "/tmp/**"        # Temporary files
  
  denied:
    - "**/.git/**"     # Git internals
    - "**/.ssh/**"     # SSH keys
    - "**/node_modules/**"  # Dependencies

# Git hooks (optional)
hooks:
  after:
    - run: git add -A
    - run: git commit -m "${COMMIT_MSG}"
      continueOnError: true

# Variables for hooks
vars:
  COMMIT_MSG: "AI-assisted changes"

# Enable clipboard integration
clipboard: true

# File watching debounce (milliseconds)
debounce_ms: 200

# Custom input/output file paths
input_file: slupe_input.md
output_file: .slupe_output.md
```

## Usage Modes

### 1. Interactive Mode (Default)
Start the listener and edit `slupe_input.md`:
```bash
slupe
```

### 2. Clipboard Mode
Enable clipboard integration:
```bash
slupe --clipboard
```

With clipboard mode enabled:
- Execution results are automatically copied to clipboard
- Slupe monitors your clipboard for NESL blocks
- When you copy two clipboard entries containing matching NESL delimiters (e.g., both containing `#!end_abc`), Slupe automatically executes the shorter entry

This enables a workflow where:
1. Copy NESL blocks from any source (LLM chat, documentation, etc.)
2. Slupe detects and executes them automatically
3. Results are copied back to your clipboard

### 3. Command Line Options
```bash
slupe [options]

Options:
  --clipboard              Enable clipboard copy on execution
  --input_file <path>      Input file path (default: slupe_input.md)
  --output_file <path>     Output file path (default: .slupe_output.md)
  --help                   Show help message
```

## Slupe Squash

Slupe includes a git squashing utility for cleaning up commit history:

```bash
slupe-squash [options]

Options:
  --containing <string>   Match commits containing string (multiple=OR, ""=all)
                         Default: "auto-slupe::" if none specified
  --limit <number>       Max commits to squash from HEAD
  --after <date>         Only consider commits after ISO date
  --message <string>     Custom message (auto-generated if omitted)  
  --push                 Push to remote using --force-with-lease
  --force                With --push, use --force instead
  --dry-run              Preview without executing
  --help                 Show help
```

Examples:
```bash
# Squash all commits containing "WIP"
slupe-squash --containing "WIP"

# Squash last 5 commits with any message
slupe-squash --containing "" --limit 5

# Squash and push with custom message
slupe-squash --message "Feature: Add authentication" --push
```

The squash tool:
- Finds commits matching your criteria
- Combines them into a single commit
- Preserves the complete file change history
- Can automatically push changes with lease protection

## Security

Slupe implements multiple security layers:

1. **Action Allowlist**: Only explicitly allowed actions can be executed
2. **Path Guards**: Fine-grained control over file system access
3. **No Shell Expansion**: Commands are executed safely without shell interpretation

## LLM Integration

To use Slupe with your LLM:

1. Include the generated `NESL_INSTRUCTIONS.md` in your LLM prompt
2. Ask the LLM to generate NESL blocks for file operations
3. Copy the LLM's response to `slupe_input.md` or use clipboard mode

Example prompt:
```
Read the NESL_INSTRUCTIONS.md file and help me create a Python script 
that calculates fibonacci numbers. Use NESL blocks to write the file.
```

## Development

```bash
# Clone the repository
git clone https://github.com/stuartcrobinson/slupe.git
cd slupe

# Install dependencies
npm install

# Run tests
npm test

# Run in development mode
npm run dev
```

## Architecture

Slupe is built with a modular component architecture:

- **Parser** (`nesl-action-parser`): Parses NESL blocks into structured actions
- **Orchestrator** (`orch`): Coordinates execution and manages workflow
- **Executors**: Specialized handlers for different action types
  - `fs-ops`: File system operations
- **Guards** (`fs-guard`): Security and access control
- **Listener**: File watching and real-time execution
- **Squash**: Git history management utility

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Stuart Robinson

## Acknowledgments

Built with:
- [nesl](https://www.npmjs.com/package/nesl) - NESL parser
- [clipboardy](https://github.com/sindresorhus/clipboardy) - Cross-platform clipboard access
- [minimatch](https://github.com/isaacs/minimatch) - Glob pattern matching