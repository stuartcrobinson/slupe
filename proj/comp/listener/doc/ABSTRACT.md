# File Listener

Watches a file for NESL blocks, executes them via orchestrator, and prepends results while managing output to clipboard and separate file.

## Overview

The listener component provides continuous monitoring of a designated input file for NESL action blocks. When file content changes (excluding any prepended results section), it executes all NESL blocks through the orchestrator component and manages the output flow. Results are formatted as a summary prepended to the input file, with full output written to a companion file and copied to clipboard.

The component handles the complete lifecycle: detecting changes via file system events, parsing content to extract NESL blocks, determining which blocks are new based on content hashing, executing actions in order, formatting results into summary and detailed views, and coordinating the three output destinations (input file prepend, output file, clipboard). It includes debouncing to handle rapid file saves and provides clear visual feedback when operations complete.

The design prioritizes developer experience with clear status indicators, handles common failure modes gracefully (permission errors, clipboard failures), and maintains a simple state model tracking only the hash of previously executed blocks.