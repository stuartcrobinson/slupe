# Command Execution

Executes code snippets in multiple languages from parsed NESL actions, capturing output and exit status for LLM feedback.

## Overview

The exec component provides controlled code execution for slupe, supporting bash, JavaScript, Python. It receives parsed SlupeAction objects containing code snippets and executes them using appropriate language interpreters via child processes. The component captures stdout, stderr, and exit codes, formatting results consistently for LLM consumption.

Each execution runs in an isolated child process with configurable working directory. The component enforces timeouts to prevent hanging processes and handles common failure modes like missing interpreters or invalid working directories. Output is captured completely before returning, with size limits to prevent memory exhaustion.

The design prioritizes predictable behavior and detailed error reporting over performance or advanced features. No sandboxing is provided - the component trusts the LLM to generate safe commands. This aligns with slupe's philosophy of treating the LLM as a responsible developer rather than an untrusted user.