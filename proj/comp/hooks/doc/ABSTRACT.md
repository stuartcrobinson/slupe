# Hooks Component

## Purpose (60 words)
Execute user-defined shell commands before and after NESL block execution. Enables VCS integration through configurable lifecycle hooks with variable interpolation, timeout control, and error handling. Loads configuration from slupe.yml files.

## Overview (300 words)
The hooks component provides lifecycle management for slupe operations, allowing users to define shell commands that run before and after NESL execution. This enables seamless version control integration without hardcoding VCS-specific logic into slupe itself.

Key features:
- Before/after hook execution with configurable commands
- Variable interpolation performed before shell execution for security
- Per-command timeout and error handling options
- YAML configuration loading from project and user directories
- Shell command escaping for safety

The component executes commands sequentially, failing fast on errors unless explicitly configured to continue. Variables are interpolated before passing to the shell, preventing injection attacks. Commands execute in the repository root by default with optional cwd override.

## Requirements (EARS format)
- The system SHALL execute before hooks prior to NESL execution
- The system SHALL execute after hooks following NESL execution
- The system SHALL interpolate variables before shell execution
- The system SHALL fail fast on command errors unless continueOnError is set
- The system SHALL respect per-command timeout values
- The system SHALL create starter slupe.yml if not exist
- The system SHALL load configuration from slupe.yml

# example

Example `slupe.yml`:

# Slupe configuration

```yaml
version: 1  # For future compatibility

hooks:
  before:
    - run: git stash --include-untracked
      
  after:
    - run: git add -A
    - run: git commit -m "${COMMIT_MSG}"
    - run: git push
      continueOnError: true
      timeout: 10000  # 10s for slow networks

# Variables available in commands
vars:
  COMMIT_MSG: "AI-assisted changes"
```

https://claude.ai/chat/d344370c-aaf5-46ec-9786-93cc208f7613
https://claude.ai/chat/4bdbd3d3-d3e6-4249-bce8-d19f882b2fba