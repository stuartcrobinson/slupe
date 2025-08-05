export const DEFAULT_SLUPE_YAML = `# Slupe configuration
version: 1

# Allowed tools (required for security)
allowed-actions:
  - write_file
  - read_file
  - delete_file
  - move_file
  - replace_text_in_file
  - replace_text_range_in_file
  - read_file_numbered
  - replace_all_text_in_file
  - read_files
  - append_to_file
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
clipboard_read: true   # Enable clipboard monitoring (default: true)
clipboard_write: true  # Enable clipboard writing (default: true)
input_file: slupe_input.md
output_file: .slupe_output.md`;