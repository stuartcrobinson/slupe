# Listener Workflow Integration Tests v2

## listener-workflow-v2

### simple-file-write

#### input file

````sh
Just a simple text file.
Nothing special here.
````

#### input file
````sh
Just a simple text file.
Nothing special here.

```sh nesl
#!nesl [@three-char-SHA-256: sf1]
action = "file_write"
path = "/tmp/t_listener_simple/output.txt"
content = "Hello from NESL!"
#!end_sf1
```
````


#### input file
````sh
=== SLUPE RESULTS ===
sf1 ✅ file_write /tmp/t_listener_simple/output.txt
=== END ===
Just a simple text file.
Nothing special here.

```sh nesl
#!nesl [@three-char-SHA-256: sf1]
action = "file_write"
path = "/tmp/t_listener_simple/output.txt"
content = "Hello from NESL!"
#!end_sf1
```
````

#### output file
````sh
=== SLUPE RESULTS ===
sf1 ✅ file_write /tmp/t_listener_simple/output.txt
=== END ===

=== OUTPUTS ===
=== END ===
````

### multiple-actions-mixed-results

#### input file

````sh
Empty file to start.
````

#### input file
````sh
Empty file to start.

```sh nesl
#!nesl [@three-char-SHA-256: wr1]
action = "file_write"
path = "/tmp/t_listener_multi/created.txt"
content = "This will succeed"
#!end_wr1
```

```sh nesl
#!nesl [@three-char-SHA-256: rd1]
action = "file_read"
path = "/tmp/t_listener_multi/missing.txt"
#!end_rd1
```

```sh nesl
#!nesl [@three-char-SHA-256: ex1]
action = "exec"
lang = "bash"
code = "echo 'Hello from bash'"
#!end_ex1
```
````

#### input file
````sh
=== SLUPE RESULTS ===
wr1 ✅ file_write /tmp/t_listener_multi/created.txt
rd1 ❌ file_read /tmp/t_listener_multi/missing.txt - File not found
ex1 ✅ exec bash
=== END ===
Empty file to start.

```sh nesl
#!nesl [@three-char-SHA-256: wr1]
action = "file_write"
path = "/tmp/t_listener_multi/created.txt"
content = "This will succeed"
#!end_wr1
```

```sh nesl
#!nesl [@three-char-SHA-256: rd1]
action = "file_read"
path = "/tmp/t_listener_multi/missing.txt"
#!end_rd1
```

```sh nesl
#!nesl [@three-char-SHA-256: ex1]
action = "exec"
lang = "bash"
code = "echo 'Hello from bash'"
#!end_ex1
```
````

#### output file
````sh
=== SLUPE RESULTS ===
wr1 ✅ file_write /tmp/t_listener_multi/created.txt
rd1 ❌ file_read /tmp/t_listener_multi/missing.txt - File not found
ex1 ✅ exec bash
=== END ===

=== OUTPUTS ===

[ex1] exec bash:
stdout:
Hello from bash
=== END ===
````

### parse-error-handling

#### Initial Content
````sh
Testing parse errors.
````

#### New Content
````sh
Testing parse errors.

```sh nesl
#!nesl [@three-char-SHA-256: bad]
action = "file_write"
path = "/tmp/t_listener_parse/test.txt"
content = "missing closing quote
#!end_bad
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
bad ❌ file_write ERROR: Unclosed quoted string (line 4)
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
bad ❌ file_write ERROR: Unclosed quoted string (line 4)
=== END ===

=== OUTPUTS ===
=== END ===
````

### no-reexecution-on-same-content

#### Initial Content
````sh
Testing hash-based execution.
````

#### New Content
````sh
Testing hash-based execution.

```sh nesl
#!nesl [@three-char-SHA-256: nc1]
action = "file_write"
path = "/tmp/t_listener_nochange/counter.txt"
content = "1"
#!end_nc1
```

Adding a comment outside NESL blocks.
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
nc1 ✅ file_write /tmp/t_listener_nochange/counter.txt
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
nc1 ✅ file_write /tmp/t_listener_nochange/counter.txt
=== END ===

=== OUTPUTS ===
=== END ===
````


### successful-file-replace-text

#### Initial Content
````sh
Testing file replacement functionality.
````

#### New Content
````sh
Testing file replacement functionality.

```sh nesl
#!nesl [@three-char-SHA-256: fr1]
action = "file_write"
path = "/tmp/t_listener_replace/config.yaml"
content = <<'EOT_fr1'
# Configuration file
database:
  host: localhost
  port: 5432
  name: myapp_dev

server:
  host: localhost
  port: 3000
EOT_fr1
#!end_fr1
```

```sh nesl
#!nesl [@three-char-SHA-256: fr2]
action = "file_replace_text"
path = "/tmp/t_listener_replace/config.yaml"
old_text = <<'EOT_fr2'
database:
  host: localhost
  port: 5432
  name: myapp_dev
EOT_fr2
new_text = <<'EOT_fr2'
database:
  host: production.example.com
  port: 5432
  name: myapp_prod
EOT_fr2
#!end_fr2
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
fr1 ✅ file_write /tmp/t_listener_replace/config.yaml
fr2 ✅ file_replace_text /tmp/t_listener_replace/config.yaml
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
fr1 ✅ file_write /tmp/t_listener_replace/config.yaml
fr2 ✅ file_replace_text /tmp/t_listener_replace/config.yaml
=== END ===

=== OUTPUTS ===
=== END ===
````

### failed-file-replace-text-multiple-matches

#### Initial Content
````sh
Testing multiple match failure.
````

#### New Content
````sh
Testing multiple match failure.

```sh nesl
#!nesl [@three-char-SHA-256: fm1]
action = "file_write"
path = "/tmp/t_listener_multi_match/app.js"
content = <<'EOT_fm1'
// Application code
function process() {
  const value = 100;
  console.log(value);
  
  if (value > 50) {
    console.log("High value");
  }
  
  return value;
}

function validate() {
  const value = 100;
  return value > 0;
}
EOT_fm1
#!end_fm1
```

```sh nesl
#!nesl [@three-char-SHA-256: fm2]
action = "file_replace_text"
path = "/tmp/t_listener_multi_match/app.js"
old_text = <<'EOT_fm2'
  const value = 100;
EOT_fm2
new_text = <<'EOT_fm2'
  const value = 999;
EOT_fm2
#!end_fm2
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
fm1 ✅ file_write /tmp/t_listener_multi_match/app.js
fm2 ❌ file_replace_text /tmp/t_listener_multi_match/app.js - old_text appears 2 times, must appear exactly once
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
fm1 ✅ file_write /tmp/t_listener_multi_match/app.js
fm2 ❌ file_replace_text /tmp/t_listener_multi_match/app.js - old_text appears 2 times, must appear exactly once
=== END ===

=== OUTPUTS ===

[fm2 ❌] /tmp/t_listener_multi_match/app.js:
=== START FILE: /tmp/t_listener_multi_match/app.js ===
// Application code
function process() {
  const value = 100;
  console.log(value);
  
  if (value > 50) {
    console.log("High value");
  }
  
  return value;
}

function validate() {
  const value = 100;
  return value > 0;
}
=== END FILE: /tmp/t_listener_multi_match/app.js ===
=== END ===
````

### failed-file-replace-text-no-matches

#### Initial Content
````sh
Testing no match failure.
````

#### New Content
````sh
Testing no match failure.

```sh nesl
#!nesl [@three-char-SHA-256: fn1]
action = "file_write"
path = "/tmp/t_listener_no_match/readme.md"
content = <<'EOT_fn1'
# Project README

This is a sample project.

## Installation

Run the following command:
- npm install

## Usage

Start the application with:
- npm start
EOT_fn1
#!end_fn1
```

```sh nesl
#!nesl [@three-char-SHA-256: fn2]
action = "file_replace_text"
path = "/tmp/t_listener_no_match/readme.md"
old_text = <<'EOT_fn2'
## Configuration

Configure the app by editing config.json
EOT_fn2
new_text = <<'EOT_fn2'
## Configuration

Configure the app by editing settings.yaml
EOT_fn2
#!end_fn2
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
fn1 ✅ file_write /tmp/t_listener_no_match/readme.md
fn2 ❌ file_replace_text /tmp/t_listener_no_match/readme.md - old_text not found in file
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
fn1 ✅ file_write /tmp/t_listener_no_match/readme.md
fn2 ❌ file_replace_text /tmp/t_listener_no_match/readme.md - old_text not found in file
=== END ===

=== OUTPUTS ===

[fn2 ❌] /tmp/t_listener_no_match/readme.md:
=== START FILE: /tmp/t_listener_no_match/readme.md ===
# Project README

This is a sample project.

## Installation

Run the following command:
- npm install

## Usage

Start the application with:
- npm start
=== END FILE: /tmp/t_listener_no_match/readme.md ===
=== END ===
````

### file-read-formatting

#### Initial Content
````sh
Testing file read output formatting.
````

#### New Content
````sh
Testing file read output formatting.

```sh nesl
#!nesl [@three-char-SHA-256: rf1]
action = "file_write"
path = "/tmp/t_listener_read/sample.py"
content = <<'EOT_rf1'
#!/usr/bin/env python3
"""Sample Python file for testing."""

def greet(name):
    """Return a greeting message."""
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("World"))
EOT_rf1
#!end_rf1
```

```sh nesl
#!nesl [@three-char-SHA-256: rf2]
action = "file_read"
path = "/tmp/t_listener_read/sample.py"
#!end_rf2
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
rf1 ✅ file_write /tmp/t_listener_read/sample.py
rf2 ✅ file_read /tmp/t_listener_read/sample.py
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
rf1 ✅ file_write /tmp/t_listener_read/sample.py
rf2 ✅ file_read /tmp/t_listener_read/sample.py
=== END ===

=== OUTPUTS ===

[rf2 ✅] /tmp/t_listener_read/sample.py:
=== START FILE: /tmp/t_listener_read/sample.py ===
#!/usr/bin/env python3
"""Sample Python file for testing."""

def greet(name):
    """Return a greeting message."""
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("World"))
=== END FILE: /tmp/t_listener_read/sample.py ===
=== END ===
````
Looking at the code and test cases, I can see that the `file_read_numbered` formatting has specific logic. Let me correct those two subsections:

### file-read-numbered-formatting

#### Initial Content
````sh
Testing file read numbered output formatting.
````

#### New Content
````sh
Testing file read numbered output formatting.

```sh nesl
#!nesl [@three-char-SHA-256: rn1]
action = "file_write"
path = "/tmp/t_listener_read_num/config.yaml"
content = <<'EOT_rn1'
line 1 
line 2
EOT_rn1
#!end_rn1
```

```sh nesl
#!nesl [@three-char-SHA-256: rn2]
action = "file_read_numbered"
path = "/tmp/t_listener_read_num/config.yaml"
#!end_rn2
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
rn1 ✅ file_write /tmp/t_listener_read_num/config.yaml
rn2 ✅ file_read_numbered /tmp/t_listener_read_num/config.yaml
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
rn1 ✅ file_write /tmp/t_listener_read_num/config.yaml
rn2 ✅ file_read_numbered /tmp/t_listener_read_num/config.yaml
=== END ===

=== OUTPUTS ===

[rn2] file_read_numbered:
=== START FILE: [numbered] /tmp/t_listener_read_num/config.yaml ===
1: line 1 
2: line 2
=== END FILE: [numbered] /tmp/t_listener_read_num/config.yaml ===
=== END ===
````


### files-read-formatting

#### Initial Content
````sh
Testing files read output formatting with multiple files.
````

#### New Content
````sh
Testing files read output formatting with multiple files.

```sh nesl
#!nesl [@three-char-SHA-256: mr1]
action = "file_write"
path = "/tmp/t_listener_multi_read/README.md"
content = <<'EOT_mr1'
# Project Documentation

This is the main README file.

## Features
- Feature 1
- Feature 2
- Feature 3
EOT_mr1
#!end_mr1
```

```sh nesl
#!nesl [@three-char-SHA-256: mr2]
action = "file_write"
path = "/tmp/t_listener_multi_read/main.py"
content = <<'EOT_mr2'
#!/usr/bin/env python3

def main():
    print("Hello from main!")

if __name__ == "__main__":
    main()
EOT_mr2
#!end_mr2
```

```sh nesl
#!nesl [@three-char-SHA-256: mr3]
action = "file_write"
path = "/tmp/t_listener_multi_read/.gitignore"
content = <<'EOT_mr3'
*.pyc
__pycache__/
.env
venv/
EOT_mr3
#!end_mr3
```

```sh nesl
#!nesl [@three-char-SHA-256: mr4]
action = "files_read"
paths = <<'EOT_mr4'
/tmp/t_listener_multi_read/README.md
/tmp/t_listener_multi_read/main.py
/tmp/t_listener_multi_read/.gitignore
EOT_mr4
#!end_mr4
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
mr1 ✅ file_write /tmp/t_listener_multi_read/README.md
mr2 ✅ file_write /tmp/t_listener_multi_read/main.py
mr3 ✅ file_write /tmp/t_listener_multi_read/.gitignore
mr4 ✅ files_read (3 files)
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
mr1 ✅ file_write /tmp/t_listener_multi_read/README.md
mr2 ✅ file_write /tmp/t_listener_multi_read/main.py
mr3 ✅ file_write /tmp/t_listener_multi_read/.gitignore
mr4 ✅ files_read (3 files)
=== END ===

=== OUTPUTS ===

[mr4] files_read:
Reading 3 files:
- /tmp/t_listener_multi_read/README.md
- /tmp/t_listener_multi_read/main.py
- /tmp/t_listener_multi_read/.gitignore

=== START FILE: /tmp/t_listener_multi_read/README.md ===
# Project Documentation

This is the main README file.

## Features
- Feature 1
- Feature 2
- Feature 3
=== END FILE: /tmp/t_listener_multi_read/README.md ===

=== START FILE: /tmp/t_listener_multi_read/main.py ===
#!/usr/bin/env python3

def main():
    print("Hello from main!")

if __name__ == "__main__":
    main()
=== END FILE: /tmp/t_listener_multi_read/main.py ===

=== START FILE: /tmp/t_listener_multi_read/.gitignore ===
*.pyc
__pycache__/
.env
venv/
=== END FILE: /tmp/t_listener_multi_read/.gitignore ===
=== END ===
````

### files-read-partial-failure

#### Initial Content
````sh
Testing files read with some missing files.
````

#### New Content
````sh
Testing files read with some missing files.

```sh nesl
#!nesl [@three-char-SHA-256: pf1]
action = "file_write"
path = "/tmp/t_listener_partial_read/exists1.txt"
content = <<'EOT_pf1'
This is the first file that exists.
It has multiple lines.
Line 3 here.
EOT_pf1
#!end_pf1
```

```sh nesl
#!nesl [@three-char-SHA-256: pf2]
action = "file_write"
path = "/tmp/t_listener_partial_read/exists2.txt"
content = <<'EOT_pf2'
Second file content.
Also exists successfully.
EOT_pf2
#!end_pf2
```

```sh nesl
#!nesl [@three-char-SHA-256: pf3]
action = "files_read"
paths = <<'EOT_pf3'
/tmp/t_listener_partial_read/exists1.txt
/tmp/t_listener_partial_read/missing1.txt
/tmp/t_listener_partial_read/exists2.txt
/tmp/t_listener_partial_read/missing2.txt
/tmp/t_listener_partial_read/also_missing.txt
EOT_pf3
#!end_pf3
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
pf1 ✅ file_write /tmp/t_listener_partial_read/exists1.txt
pf2 ✅ file_write /tmp/t_listener_partial_read/exists2.txt
pf3 ⚠️  files_read (5 files) - Read 2 of 5 files (3 failed)
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
pf1 ✅ file_write /tmp/t_listener_partial_read/exists1.txt
pf2 ✅ file_write /tmp/t_listener_partial_read/exists2.txt
pf3 ⚠️  files_read (5 files) - Read 2 of 5 files (3 failed)
=== END ===

=== OUTPUTS ===

[pf3] files_read:
Successfully read 2 of 5 files (3 failed):

✅ Successfully read:
- /tmp/t_listener_partial_read/exists1.txt
- /tmp/t_listener_partial_read/exists2.txt

❌ Failed to read:
- /tmp/t_listener_partial_read/missing1.txt: ENOENT: no such file or directory, open '/tmp/t_listener_partial_read/missing1.txt'
- /tmp/t_listener_partial_read/missing2.txt: ENOENT: no such file or directory, open '/tmp/t_listener_partial_read/missing2.txt'
- /tmp/t_listener_partial_read/also_missing.txt: ENOENT: no such file or directory, open '/tmp/t_listener_partial_read/also_missing.txt'

=== START FILE: /tmp/t_listener_partial_read/exists1.txt ===
This is the first file that exists.
It has multiple lines.
Line 3 here.
=== END FILE: /tmp/t_listener_partial_read/exists1.txt ===

=== START FILE: /tmp/t_listener_partial_read/exists2.txt ===
Second file content.
Also exists successfully.
=== END FILE: /tmp/t_listener_partial_read/exists2.txt ===
=== END ===
````

### listener-parsing-errors

#### Initial Content
````sh
Testing multiple parse error types.
````

#### New Content
````sh
Testing multiple parse error types.

```sh nesl
#!nesl [@three-char-SHA-256: pe1]
action = "file_write"
path = "/tmp/t_parse_errors/test1.txt"
content = "missing closing quote
#!end_pe1
```

```sh nesl
#!nesl [@three-char-SHA-256: pe2]
action := "file_read"
path = "/tmp/t_parse_errors/test2.txt"
#!end_pe2
```

```sh nesl
#!nesl [@three-char-SHA-256: pe3]
just some random text without assignment
#!end_pe3
```

```sh nesl
#!nesl [@three-char-SHA-256: pe4]
action = "file_write"
path = <<EOT_pe4
/tmp/test.txt
EOT_pe4
#!end_pe4
```

```sh nesl
#!nesl [@three-char-SHA-256: pe5]
action = "exec"
lang = "bash"
code = "echo 'test'" extra stuff
#!end_pe5
```

```sh nesl
#!nesl [@three-char-SHA-256: 1234567890]
action = "exec"
lang = "bash"
code = "echo 'test'"
#!end_1234567890
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
pe1 ❌ file_write ERROR: Unclosed quoted string (line 4)
pe2 ❌ -          ERROR: Invalid assignment operator ':=' - only '=' is allowed (line 12)
pe3 ❌ -          ERROR: Invalid line format in block 'pe3': not a valid key-value assignment or empty line (line 19)
pe4 ❌ file_write ERROR: 3 syntax errors (line 25)
                    - Value must be a quoted string or heredoc
                    - Invalid line format in block 'pe4': not a valid key-value assignment or empty line (2 occurrences)
pe5 ❌ exec       ERROR: Unexpected content after quoted value (line 34)
unknown ❌ -          ERROR: Block ID must be exactly 3 characters (line 42)
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
pe1 ❌ file_write ERROR: Unclosed quoted string (line 4)
pe2 ❌ -          ERROR: Invalid assignment operator ':=' - only '=' is allowed (line 12)
pe3 ❌ -          ERROR: Invalid line format in block 'pe3': not a valid key-value assignment or empty line (line 19)
pe4 ❌ file_write ERROR: 3 syntax errors (line 25)
                    - Value must be a quoted string or heredoc
                    - Invalid line format in block 'pe4': not a valid key-value assignment or empty line (2 occurrences)
pe5 ❌ exec       ERROR: Unexpected content after quoted value (line 34)
unknown ❌ -          ERROR: Block ID must be exactly 3 characters (line 42)
=== END ===

=== OUTPUTS ===
=== END ===
````

#### Expected Clipboard
````sh
=== SLUPE RESULTS ===
pe1 ❌ file_write ERROR: Unclosed quoted string (line 4)
pe2 ❌ -          ERROR: Invalid assignment operator ':=' - only '=' is allowed (line 12)
pe3 ❌ -          ERROR: Invalid line format in block 'pe3': not a valid key-value assignment or empty line (line 19)
pe4 ❌ file_write ERROR: 3 syntax errors (line 25)
                    - Value must be a quoted string or heredoc
                    - Invalid line format in block 'pe4': not a valid key-value assignment or empty line (2 occurrences)
pe5 ❌ exec       ERROR: Unexpected content after quoted value (line 34)
unknown ❌ -          ERROR: Block ID must be exactly 3 characters (line 42)
=== END ===

=== OUTPUTS ===
=== END ===
````


You're absolutely right! I completely messed up the format. Looking at the other test cases, I need to provide the proper 4-section format. Here's the corrected test case:

### multiple-failures-show-file-contents

#### Initial Content
````sh
Testing multiple file replacement failures.
````

#### New Content
````sh
Testing multiple file replacement failures.

```sh nesl
#!nesl [@three-char-SHA-256: mf1]
action = "file_write"
path = "/tmp/t_multiple-failures-show-file-contents/file1.txt"
content = <<'EOT_mf1'
foo bar
foo baz
end line
EOT_mf1
#!end_mf1
```

```sh nesl
#!nesl [@three-char-SHA-256: mf2]
action = "file_write"
path = "/tmp/t_multiple-failures-show-file-contents/file2.txt"
content = <<'EOT_mf2'
hello world
test line
goodbye
EOT_mf2
#!end_mf2
```

```sh nesl
#!nesl [@three-char-SHA-256: mf3]
action = "file_write"
path = "/tmp/t_multiple-failures-show-file-contents/file3.txt"
content = <<'EOT_mf3'
cat dog
bird fish
last one
EOT_mf3
#!end_mf3
```

```sh nesl
#!nesl [@three-char-SHA-256: fs1]
action = "file_replace_text"
path = "/tmp/t_multiple-failures-show-file-contents/file1.txt"
old_text = "foo"
new_text = "bar"
#!end_fs1
```

```sh nesl
#!nesl [@three-char-SHA-256: fs2]
action = "file_replace_text"
path = "/tmp/t_multiple-failures-show-file-contents/file2.txt"
old_text = "missing text"
new_text = "replacement"
#!end_fs2
```

```sh nesl
#!nesl [@three-char-SHA-256: fs3]
action = "file_replace_text"
path = "/tmp/t_multiple-failures-show-file-contents/file3.txt"
old_text = "cat dog"
new_text = "dog cat"
#!end_fs3
```

```sh nesl
#!nesl [@three-char-SHA-256: fs4]
action = "file_replace_text"
path = "/tmp/t_multiple-failures-show-file-contents/file1.txt"
old_text = "missing line"
new_text = "replacement"
#!end_fs4
```

```sh nesl
#!nesl [@three-char-SHA-256: fs5]
action = "file_read"
path = "/tmp/t_multiple-failures-show-file-contents/file1.txt"
#!end_fs5
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
mf1 ✅ file_write /tmp/t_multiple-failures-show-file-contents/file1.txt
mf2 ✅ file_write /tmp/t_multiple-failures-show-file-contents/file2.txt
mf3 ✅ file_write /tmp/t_multiple-failures-show-file-contents/file3.txt
fs1 ❌ file_replace_text /tmp/t_multiple-failures-show-file-contents/file1.txt - old_text appears 2 times, must appear exactly once
fs2 ❌ file_replace_text /tmp/t_multiple-failures-show-file-contents/file2.txt - old_text not found in file
fs3 ✅ file_replace_text /tmp/t_multiple-failures-show-file-contents/file3.txt
fs4 ❌ file_replace_text /tmp/t_multiple-failures-show-file-contents/file1.txt - old_text not found in file
fs5 ✅ file_read /tmp/t_multiple-failures-show-file-contents/file1.txt
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
mf1 ✅ file_write /tmp/t_multiple-failures-show-file-contents/file1.txt
mf2 ✅ file_write /tmp/t_multiple-failures-show-file-contents/file2.txt
mf3 ✅ file_write /tmp/t_multiple-failures-show-file-contents/file3.txt
fs1 ❌ file_replace_text /tmp/t_multiple-failures-show-file-contents/file1.txt - old_text appears 2 times, must appear exactly once
fs2 ❌ file_replace_text /tmp/t_multiple-failures-show-file-contents/file2.txt - old_text not found in file
fs3 ✅ file_replace_text /tmp/t_multiple-failures-show-file-contents/file3.txt
fs4 ❌ file_replace_text /tmp/t_multiple-failures-show-file-contents/file1.txt - old_text not found in file
fs5 ✅ file_read /tmp/t_multiple-failures-show-file-contents/file1.txt
=== END ===

=== OUTPUTS ===

[fs1 ❌, fs4 ❌, fs5 ✅] /tmp/t_multiple-failures-show-file-contents/file1.txt:
=== START FILE: /tmp/t_multiple-failures-show-file-contents/file1.txt ===
foo bar
foo baz
end line
=== END FILE: /tmp/t_multiple-failures-show-file-contents/file1.txt ===

[fs2 ❌] /tmp/t_multiple-failures-show-file-contents/file2.txt:
=== START FILE: /tmp/t_multiple-failures-show-file-contents/file2.txt ===
hello world
test line
goodbye
=== END FILE: /tmp/t_multiple-failures-show-file-contents/file2.txt ===
=== END ===
````


### successful-file-replace-text-range

#### Initial Content
````sh
Testing file replace text range functionality.
````

#### New Content
````sh
Testing file replace text range functionality.

```sh nesl
#!nesl [@three-char-SHA-256: rr1]
action = "file_write"
path = "/tmp/t_listener_replace_range/document.txt"
content = <<'EOT_rr1'
This is the beginning of the document.
Here is some content in the middle.
We want to replace from here until the end of this line.
This line should remain unchanged.
And this is the final line.
EOT_rr1
#!end_rr1
```

```sh nesl
#!nesl [@three-char-SHA-256: rr2]
action = "file_replace_text_range"
path = "/tmp/t_listener_replace_range/document.txt"
old_text_beginning = "We want to replace"
old_text_end = "this line."
new_text = "This entire section has been replaced."
#!end_rr2
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
rr1 ✅ file_write /tmp/t_listener_replace_range/document.txt
rr2 ✅ file_replace_text_range /tmp/t_listener_replace_range/document.txt
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
rr1 ✅ file_write /tmp/t_listener_replace_range/document.txt
rr2 ✅ file_replace_text_range /tmp/t_listener_replace_range/document.txt
=== END ===

=== OUTPUTS ===
=== END ===
````

### failed-file-replace-text-range-multiple-beginnings

#### Initial Content
````sh
Testing file replace text range with multiple beginning matches.
````

#### New Content
````sh
Testing file replace text range with multiple beginning matches.

```sh nesl
#!nesl [@three-char-SHA-256: rm1]
action = "file_write"
path = "/tmp/t_listener_replace_range_multi/code.js"
content = <<'EOT_rm1'
function process() {
  const value = 100;
  return value;
}

function validate() {
  const value = 200;
  return value > 0;
}
EOT_rm1
#!end_rm1
```

```sh nesl
#!nesl [@three-char-SHA-256: rm2]
action = "file_replace_text_range"
path = "/tmp/t_listener_replace_range_multi/code.js"
old_text_beginning = "const value"
old_text_end = ";"
new_text = "const value = 999;"
#!end_rm2
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
rm1 ✅ file_write /tmp/t_listener_replace_range_multi/code.js
rm2 ❌ file_replace_text_range /tmp/t_listener_replace_range_multi/code.js - old_text_beginning appears 2 times, must appear exactly once
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
rm1 ✅ file_write /tmp/t_listener_replace_range_multi/code.js
rm2 ❌ file_replace_text_range /tmp/t_listener_replace_range_multi/code.js - old_text_beginning appears 2 times, must appear exactly once
=== END ===

=== OUTPUTS ===

[rm2 ❌] /tmp/t_listener_replace_range_multi/code.js:
=== START FILE: /tmp/t_listener_replace_range_multi/code.js ===
function process() {
  const value = 100;
  return value;
}

function validate() {
  const value = 200;
  return value > 0;
}
=== END FILE: /tmp/t_listener_replace_range_multi/code.js ===
=== END ===
````

### failed-file-replace-text-range-beginning-not-found

#### Initial Content
````sh
Testing file replace text range with beginning not found.
````

#### New Content
````sh
Testing file replace text range with beginning not found.

```sh nesl
#!nesl [@three-char-SHA-256: rn1]
action = "file_write"
path = "/tmp/t_listener_replace_range_notfound/notes.md"
content = <<'EOT_rn1'
# Project Notes

## Section 1
Some important information here.

## Section 2
More details in this section.

## Section 3
Final thoughts and conclusions.
EOT_rn1
#!end_rn1
```

```sh nesl
#!nesl [@three-char-SHA-256: rn2]
action = "file_replace_text_range"
path = "/tmp/t_listener_replace_range_notfound/notes.md"
old_text_beginning = "## Section 4"
old_text_end = "conclusions."
new_text = "## Section 4\nNew content here."
#!end_rn2
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
rn1 ✅ file_write /tmp/t_listener_replace_range_notfound/notes.md
rn2 ❌ file_replace_text_range /tmp/t_listener_replace_range_notfound/notes.md - old_text_beginning not found in file
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
rn1 ✅ file_write /tmp/t_listener_replace_range_notfound/notes.md
rn2 ❌ file_replace_text_range /tmp/t_listener_replace_range_notfound/notes.md - old_text_beginning not found in file
=== END ===

=== OUTPUTS ===

[rn2 ❌] /tmp/t_listener_replace_range_notfound/notes.md:
=== START FILE: /tmp/t_listener_replace_range_notfound/notes.md ===
# Project Notes

## Section 1
Some important information here.

## Section 2
More details in this section.

## Section 3
Final thoughts and conclusions.
=== END FILE: /tmp/t_listener_replace_range_notfound/notes.md ===
=== END ===
````


### file-append-simple

#### Initial Content
````sh
Testing file append functionality.
````

#### New Content
````sh
Testing file append functionality.

```sh nesl
#!nesl [@three-char-SHA-256: ap1]
action = "file_write"
path = "/tmp/t_listener_append/journal.txt"
content = <<'EOT_ap1'
=== Daily Journal ===
Day 1: Started the project
Day 2: Made good progress
EOT_ap1
#!end_ap1
```

```sh nesl
#!nesl [@three-char-SHA-256: ap2]
action = "file_append"
path = "/tmp/t_listener_append/journal.txt"
content = <<'EOT_ap2'
Day 3: Fixed critical bug
Day 4: Released version 1.0
EOT_ap2
#!end_ap2
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
ap1 ✅ file_write /tmp/t_listener_append/journal.txt
ap2 ✅ file_append /tmp/t_listener_append/journal.txt
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
ap1 ✅ file_write /tmp/t_listener_append/journal.txt
ap2 ✅ file_append /tmp/t_listener_append/journal.txt
=== END ===

=== OUTPUTS ===
=== END ===
````

### file-append-create-new

#### Initial Content
````sh
Testing append to create new file.
````

#### New Content
````sh
Testing append to create new file.

```sh nesl
#!nesl [@three-char-SHA-256: ac1]
action = "file_append"
path = "/tmp/t_listener_append_new/fresh-log.txt"
content = <<'EOT_ac1'
=== Application Log ===
[2024-01-01 08:00] Application starting...
[2024-01-01 08:01] Initialization complete
[2024-01-01 08:02] Ready to accept connections
EOT_ac1
#!end_ac1
```

```sh nesl
#!nesl [@three-char-SHA-256: ac2]
action = "file_append"
path = "/tmp/t_listener_append_new/fresh-log.txt"
content = <<'EOT_ac2'
[2024-01-01 09:00] First request received
[2024-01-01 09:15] Processing batch job
EOT_ac2
#!end_ac2
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
ac1 ✅ file_append /tmp/t_listener_append_new/fresh-log.txt
ac2 ✅ file_append /tmp/t_listener_append_new/fresh-log.txt
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
ac1 ✅ file_append /tmp/t_listener_append_new/fresh-log.txt
ac2 ✅ file_append /tmp/t_listener_append_new/fresh-log.txt
=== END ===

=== OUTPUTS ===
=== END ===
````

### file-append-with-read

#### Initial Content
````sh
Testing append with subsequent read.
````

#### New Content
````sh
Testing append with subsequent read.

```sh nesl
#!nesl [@three-char-SHA-256: ar1]
action = "file_write"
path = "/tmp/t_listener_append_read/messages.txt"
content = <<'EOT_ar1'
Message 1: Hello
Message 2: How are you?
EOT_ar1
#!end_ar1
```

```sh nesl
#!nesl [@three-char-SHA-256: ar2]
action = "file_append"
path = "/tmp/t_listener_append_read/messages.txt"
content = <<'EOT_ar2'
Message 3: Great to hear!
Message 4: See you soon
EOT_ar2
#!end_ar2
```

```sh nesl
#!nesl [@three-char-SHA-256: ar3]
action = "file_read"
path = "/tmp/t_listener_append_read/messages.txt"
#!end_ar3
```
````

#### Expected Prepended Results
````sh
=== SLUPE RESULTS ===
ar1 ✅ file_write /tmp/t_listener_append_read/messages.txt
ar2 ✅ file_append /tmp/t_listener_append_read/messages.txt
ar3 ✅ file_read /tmp/t_listener_append_read/messages.txt
=== END ===
````

#### Expected Output File
````sh
=== SLUPE RESULTS ===
ar1 ✅ file_write /tmp/t_listener_append_read/messages.txt
ar2 ✅ file_append /tmp/t_listener_append_read/messages.txt
ar3 ✅ file_read /tmp/t_listener_append_read/messages.txt
=== END ===

=== OUTPUTS ===

[ar3 ✅] /tmp/t_listener_append_read/messages.txt:
=== START FILE: /tmp/t_listener_append_read/messages.txt ===
Message 1: Hello
Message 2: How are you?Message 3: Great to hear!
Message 4: See you soon
=== END FILE: /tmp/t_listener_append_read/messages.txt ===
=== END ===
````
