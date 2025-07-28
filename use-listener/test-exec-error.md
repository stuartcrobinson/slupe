# Test Exec Error Formatting

```sh nesl
#!nesl [@three-char-SHA-256: xyz]
action = "exec"
lang = "bash"
code = "npx vitest run **/orch/** --hideSkippedTests"
#!end_xyz
```