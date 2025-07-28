# File System Operations

Executes file and directory operations from parsed NESL actions, providing consistent error handling and operation results for LLM feedback.

## Overview

The fs-ops component is the primary executor for file system operations in slupe. It receives parsed SlupeAction objects from the nesl-action-parser and performs the requested file system operations, returning standardized results that include success status, operation-specific data, and detailed error information when operations fail.

The component handles all file-related NESL actions including file creation, editing, deletion, and reading, as well as directory operations and search functionality. It automatically handles common scenarios like creating parent directories for new files and provides detailed error messages that help the LLM understand why operations failed.

Each operation is designed to be atomic and independent, with no shared state between operations. This ensures predictable behavior and makes it easy for the LLM to reason about the effects of each action.