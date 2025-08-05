export const DEFAULT_SLUPE_YAML = `# Slupe configuration
version: 1

# Allowed tools (required for security)
allowed-actions:
  - file_write
  - file_read
  - file_delete
  - file_move
  - file_replace_text
  - file_replace_text_range
  - file_read_numbered
  - file_replace_all_text
  - files_read
  - exec

# File system guard configuration
fs-guard:
  # Allowed paths (supports glob patterns)
  # Relative paths are resolved from this config file's location
  allowed:
    - "./**"           # All files in project
    - "/tmp/**"        # Temporary files
  
  # Denied paths (more specific rules override less specific)
  denied:
    - "**/.git/**"     # Git internals
    - "**/.ssh/**"     # SSH keys
    - "**/node_modules/**"  # Dependencies
  
  # Whether to follow symlinks (default: false)
  followSymlinks: false

# Git hooks configuration
hooks:
  # before: []
  # after:
  #   - run: |
  #       git add -A && 
  #       if git diff --cached --quiet; then 
  #         echo "No changes to commit"; 
  #       else 
  #         git commit -m "$(echo "auto-slupe:: $(git diff --cached --name-only | wc -l | tr -d ' ') files:$(git diff --cached --name-only | head -10)")" && 
  #         git push -u origin HEAD; 
  #       fi
  
# Variables available in commands
vars:
  COMMIT_MSG: "auto-slupe::"
  # Add more variables as needed

# Listener configuration
clipboard: false  # Enable clipboard copy on execution
input_file: slupe_input.md
output_file: .slupe_output.md`;