# Security

Validates file system paths against configurable allow/deny rules before fs-ops operations execute, preventing unintended file access.

## Overview

The fs-guard component provides path validation for all file system operations in slupe. It intercepts fs-ops actions before execution, canonicalizes paths to resolve symlinks and relative references, then checks them against user-defined glob patterns. The component supports separate read and write permissions with a most-specific-match precedence system.

Configuration lives in slupe.yml with four lists: read-allow, read-deny, write-allow, and write-deny. Patterns can be relative (resolved from slupe.yml location) or absolute. The validation process follows symlinks via canonicalization, making rules apply to actual file locations rather than symlink paths. When paths match multiple rules, the most specific pattern wins, enabling fine-grained control like denying a directory while allowing specific subdirectories.

The component integrates at the fs-ops executor level, checking every file operation before it proceeds. Operations requiring multiple permissions (like file_replace_text needing both read and write) must pass all checks. Clear error messages distinguish fs-guard violations from operational failures, helping LLMs understand why operations failed.