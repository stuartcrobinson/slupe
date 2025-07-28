# JavaScript Execution Test Cases

## Basic console.log
```sh nesl
#!nesl [@three-char-SHA-256: j1s]
action = "exec"
lang = "javascript"
code = "console.log('Hello from Node.js')"
#!end_j1s
```

```json
{
  "success": true,
  "stdout": "Hello from Node.js\n",
  "stderr": "",
  "exit_code": 0
}
```

## Multi-line with variables
```sh nesl
#!nesl [@three-char-SHA-256: j2s]
action = "exec"
lang = "javascript"
code = <<'EOT_j2s'
const numbers = [1, 2, 3];
numbers.forEach(n => {
  console.log(`Number: ${n}`);
});
EOT_j2s
#!end_j2s
```

```json
{
  "success": true,
  "stdout": "Number: 1\nNumber: 2\nNumber: 3\n",
  "stderr": "",
  "exit_code": 0
}
```

## Syntax error
```sh nesl
#!nesl [@three-char-SHA-256: j3s]
action = "exec"
lang = "javascript"
code = "console.log('unclosed string"
#!end_j3s
```

```json
{
  "success": false,
  "stdout": "",
  "stderr": "{SYNTAX_ERROR_OUTPUT}",
  "exit_code": 1
}
```

## Process.exit with code
```sh nesl
#!nesl [@three-char-SHA-256: j4s]
action = "exec"
lang = "javascript"
code = "console.log('Exiting...'); process.exit(42);"
#!end_j4s
```

```json
{
  "success": false,
  "stdout": "Exiting...\n",
  "stderr": "",
  "exit_code": 42
}
```

## Working directory check
```sh nesl
#!nesl [@three-char-SHA-256: j5s]
action = "exec"
lang = "javascript"
code = "console.log(process.cwd())"
cwd = "/tmp"
#!end_j5s
```

```json
{
  "success": true,
  "stdout": "/tmp\n",
  "stderr": "",
  "exit_code": 0
}
```

## Async/await support
```sh nesl
#!nesl [@three-char-SHA-256: j6s]
action = "exec"
lang = "javascript"
code = <<'EOT_j6s'
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  await delay(100);
  console.log('After delay');
})();
EOT_j6s
#!end_j6s
```

```json
{
  "success": true,
  "stdout": "After delay\n",
  "stderr": "",
  "exit_code": 0
}
```

## JSON output
```sh nesl
#!nesl [@three-char-SHA-256: j7s]
action = "exec"
lang = "javascript"
code = "console.log(JSON.stringify({status: 'ok', count: 3}))"
#!end_j7s
```

```json
{
  "success": true,
  "stdout": "{\"status\":\"ok\",\"count\":3}\n",
  "stderr": "",
  "exit_code": 0
}
```