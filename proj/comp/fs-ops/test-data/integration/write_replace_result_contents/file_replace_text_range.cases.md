# file_replace_text_range Integration Tests

## file_replace_text_range

### 001-simple-range-replacement

```sh nesl
#!nesl [@three-char-SHA-256: sr1]
action = "file_write"
path = "/tmp/t_simple-range-replacement/range-test.txt"
content = "prefix [START] middle content [END] suffix"
#!end_sr1
```

```sh nesl
#!nesl [@three-char-SHA-256: sr2]
action = "file_replace_text_range"
path = "/tmp/t_simple-range-replacement/range-test.txt"
old_text_beginning = "[START]"
old_text_end = "[END]"
new_text = "[REPLACED]"
#!end_sr2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_simple-range-replacement/range-test.txt",
    "replacements": 1
  }
}
```

```
prefix [REPLACED] suffix
```

### 002-multiline-range-replacement

```sh nesl
#!nesl [@three-char-SHA-256: ml1]
action = "file_write"
path = "/tmp/t_multiline-range-replacement/multiline.txt"
content = <<'EOT_ml1'
function oldImplementation() {
  // OLD START
  console.log('old version');
  const data = processOldWay();
  return data;
  // OLD END
}

function keepThis() {
  return true;
}
EOT_ml1
#!end_ml1
```

```sh nesl
#!nesl [@three-char-SHA-256: ml2]
action = "file_replace_text_range"
path = "/tmp/t_multiline-range-replacement/multiline.txt"
old_text_beginning = <<'EOT_ml2'
  // OLD START
EOT_ml2
old_text_end = <<'EOT_ml2'
  // OLD END
EOT_ml2
new_text = <<'EOT_ml2'
  // NEW VERSION
  console.log('new version');
  const data = await processNewWay();
  return data;
  // END NEW VERSION
EOT_ml2
#!end_ml2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_multiline-range-replacement/multiline.txt",
    "replacements": 1
  }
}
```

```
function oldImplementation() {
  // NEW VERSION
  console.log('new version');
  const data = await processNewWay();
  return data;
  // END NEW VERSION
}

function keepThis() {
  return true;
}
```

### 003-overlapping-markers

```sh nesl
#!nesl [@three-char-SHA-256: ov1]
action = "file_write"
path = "/tmp/t_overlapping-markers/overlap.txt"
content = "function foo() { return 42; }"
#!end_ov1
```

```sh nesl
#!nesl [@three-char-SHA-256: ov2]
action = "file_replace_text_range"
path = "/tmp/t_overlapping-markers/overlap.txt"
old_text_beginning = "function foo() {"
old_text_end = "() {"
new_text = "const foo = () => {"
#!end_ov2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_overlapping-markers/overlap.txt",
    "replacements": 1
  }
}
```

```
const foo = () => { return 42; }
```

### 004-empty-range-content

```sh nesl
#!nesl [@three-char-SHA-256: em1]
action = "file_write"
path = "/tmp/t_empty-range-content/empty.txt"
content = "before <!-- START --><!-- END --> after"
#!end_em1
```

```sh nesl
#!nesl [@three-char-SHA-256: em2]
action = "file_replace_text_range"
path = "/tmp/t_empty-range-content/empty.txt"
old_text_beginning = "<!-- START -->"
old_text_end = "<!-- END -->"
new_text = "<!-- CONTENT ADDED -->"
#!end_em2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_empty-range-content/empty.txt",
    "replacements": 1
  }
}
```

```
before <!-- CONTENT ADDED --> after
```

### 005-start-marker-not-found

```sh nesl
#!nesl [@three-char-SHA-256: sn1]
action = "file_write"
path = "/tmp/t_start-marker-not-found/no-start.txt"
content = "some content with only [END] marker"
#!end_sn1
```

```sh nesl
#!nesl [@three-char-SHA-256: sn2]
action = "file_replace_text_range"
path = "/tmp/t_start-marker-not-found/no-start.txt"
old_text_beginning = "[START]"
old_text_end = "[END]"
new_text = "[REPLACED]"
#!end_sn2
```

```json
{
  "success": false,
  "error": "file_replace_text_range: old_text_beginning not found in file"
}
```

### 006-end-marker-not-found-after-start

```sh nesl
#!nesl [@three-char-SHA-256: en1]
action = "file_write"
path = "/tmp/t_end-marker-not-found/no-end.txt"
content = "[END] comes before [START] but no end after"
#!end_en1
```

```sh nesl
#!nesl [@three-char-SHA-256: en2]
action = "file_replace_text_range"
path = "/tmp/t_end-marker-not-found/no-end.txt"
old_text_beginning = "[START]"
old_text_end = "[END]"
new_text = "[REPLACED]"
#!end_en2
```

```json
{
  "success": false,
  "error": "file_replace_text_range: old_text_end not found after old_text_beginning"
}
```

### 007-multiple-start-markers

```sh nesl
#!nesl [@three-char-SHA-256: ms1]
action = "file_write"
path = "/tmp/t_multiple-start-markers/multi-start.txt"
content = "[START] first [END] then [START] second [END]"
#!end_ms1
```

```sh nesl
#!nesl [@three-char-SHA-256: ms2]
action = "file_replace_text_range"
path = "/tmp/t_multiple-start-markers/multi-start.txt"
old_text_beginning = "[START]"
old_text_end = "[END]"
new_text = "[REPLACED]"
#!end_ms2
```

```json
{
  "success": false,
  "error": "file_replace_text_range: old_text_beginning appears 2 times, must appear exactly once"
}
```

### 008-multiple-end-markers-after-start

```sh nesl
#!nesl [@three-char-SHA-256: me1]
action = "file_write"
path = "/tmp/t_multiple-end-markers/multi-end.txt"
content = "prefix [START] content [END] middle [END] suffix"
#!end_me1
```

```sh nesl
#!nesl [@three-char-SHA-256: me2]
action = "file_replace_text_range"
path = "/tmp/t_multiple-end-markers/multi-end.txt"
old_text_beginning = "[START]"
old_text_end = "[END]"
new_text = "[REPLACED]"
#!end_me2
```

```json
{
  "success": false,
  "error": "file_replace_text_range: old_text_end appears 2 times after old_text_beginning, must appear exactly once"
}
```

### 009-end-markers-before-start-ignored

```sh nesl
#!nesl [@three-char-SHA-256: eb1]
action = "file_write"
path = "/tmp/t_end-before-start-ignored/end-before.txt"
content = "[END] ignored [END] also ignored [START] content [END] this is the one"
#!end_eb1
```

```sh nesl
#!nesl [@three-char-SHA-256: eb2]
action = "file_replace_text_range"
path = "/tmp/t_end-before-start-ignored/end-before.txt"
old_text_beginning = "[START]"
old_text_end = "[END]"
new_text = "[REPLACED]"
#!end_eb2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_end-before-start-ignored/end-before.txt",
    "replacements": 1
  }
}
```

```
[END] ignored [END] also ignored [REPLACED] this is the one
```

### 010-empty-start-marker-error

```sh nesl
#!nesl [@three-char-SHA-256: es1]
action = "file_write"
path = "/tmp/t_empty-start-marker/empty-start.txt"
content = "some content"
#!end_es1
```

```sh nesl
#!nesl [@three-char-SHA-256: es2]
action = "file_replace_text_range"
path = "/tmp/t_empty-start-marker/empty-start.txt"
old_text_beginning = ""
old_text_end = "content"
new_text = "replaced"
#!end_es2
```

```json
{
  "success": false,
  "error": "file_replace_text_range: old_text_beginning cannot be empty"
}
```

### 011-empty-end-marker-error

```sh nesl
#!nesl [@three-char-SHA-256: ee1]
action = "file_write"
path = "/tmp/t_empty-end-marker/empty-end.txt"
content = "some content"
#!end_ee1
```

```sh nesl
#!nesl [@three-char-SHA-256: ee2]
action = "file_replace_text_range"
path = "/tmp/t_empty-end-marker/empty-end.txt"
old_text_beginning = "some"
old_text_end = ""
new_text = "replaced"
#!end_ee2
```

```json
{
  "success": false,
  "error": "file_replace_text_range: old_text_end cannot be empty"
}
```

### 012-identical-start-and-end-markers

```sh nesl
#!nesl [@three-char-SHA-256: id1]
action = "file_write"
path = "/tmp/t_identical-markers/identical.txt"
content = "before ### content ### after"
#!end_id1
```

```sh nesl
#!nesl [@three-char-SHA-256: id2]
action = "file_replace_text_range"
path = "/tmp/t_identical-markers/identical.txt"
old_text_beginning = "###"
old_text_end = "###"
new_text = "---"
#!end_id2
```

```json
{
  "success": false,
  "error": "file_replace_text_range: old_text_beginning appears 2 times, must appear exactly once"
}
```

### 013-complex-code-block-range

```sh nesl
#!nesl [@three-char-SHA-256: cc1]
action = "file_write"
path = "/tmp/t_complex-code-block/complex.ts"
content = <<'EOT_cc1'
export class UserService {
  constructor(private db: Database) {}

  // BEGIN: deprecated methods
  async oldGetUser(id: string) {
    return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
  }

  async oldUpdateUser(id: string, data: any) {
    return this.db.query(`UPDATE users SET data = '${data}' WHERE id = ${id}`);
  }
  // END: deprecated methods

  async getCurrentUser() {
    return this.context.user;
  }
}
EOT_cc1
#!end_cc1
```

```sh nesl
#!nesl [@three-char-SHA-256: cc2]
action = "file_replace_text_range"
path = "/tmp/t_complex-code-block/complex.ts"
old_text_beginning = <<'EOT_cc2'
  // BEGIN: deprecated methods
EOT_cc2
old_text_end = <<'EOT_cc2'
  // END: deprecated methods
EOT_cc2
new_text = <<'EOT_cc2'
  // Modern methods with proper escaping
  async getUser(id: string) {
    return this.db.query('SELECT * FROM users WHERE id = ?', [id]);
  }

  async updateUser(id: string, data: any) {
    return this.db.query('UPDATE users SET data = ? WHERE id = ?', [data, id]);
  }
EOT_cc2
#!end_cc2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_complex-code-block/complex.ts",
    "replacements": 1
  }
}
```

```
export class UserService {
  constructor(private db: Database) {}

  // Modern methods with proper escaping
  async getUser(id: string) {
    return this.db.query('SELECT * FROM users WHERE id = ?', [id]);
  }

  async updateUser(id: string, data: any) {
    return this.db.query('UPDATE users SET data = ? WHERE id = ?', [data, id]);
  }

  async getCurrentUser() {
    return this.context.user;
  }
}
```

### 014-whitespace-sensitive-range

```sh nesl
#!nesl [@three-char-SHA-256: ws1]
action = "file_write"
path = "/tmp/t_whitespace-sensitive-range/whitespace.txt"
content = <<'EOT_ws1'
  class Component {
    render() {
      return (
        <div>
          {/* START SECTION */}
          <h1>Old Title</h1>
          <p>Old content here</p>
          {/* END SECTION */}
        </div>
      );
    }
  }
EOT_ws1
#!end_ws1
```

```sh nesl
#!nesl [@three-char-SHA-256: ws2]
action = "file_replace_text_range"
path = "/tmp/t_whitespace-sensitive-range/whitespace.txt"
old_text_beginning = "          {/* START SECTION */}"
old_text_end = "          {/* END SECTION */}"
new_text = <<'EOT_ws2'
          {/* NEW SECTION */}
          <h2>New Title</h2>
          <p>New content with proper indentation</p>
          {/* END NEW SECTION */}
EOT_ws2
#!end_ws2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_whitespace-sensitive-range/whitespace.txt",
    "replacements": 1
  }
}
```

```
  class Component {
    render() {
      return (
        <div>
          {/* NEW SECTION */}
          <h2>New Title</h2>
          <p>New content with proper indentation</p>
          {/* END NEW SECTION */}
        </div>
      );
    }
  }
```

### 015-range-at-file-boundaries

```sh nesl
#!nesl [@three-char-SHA-256: fb1]
action = "file_write"
path = "/tmp/t_range-at-boundaries/boundaries.txt"
content = "<!-- BEGIN -->entire file content<!-- END -->"
#!end_fb1
```

```sh nesl
#!nesl [@three-char-SHA-256: fb2]
action = "file_replace_text_range"
path = "/tmp/t_range-at-boundaries/boundaries.txt"
old_text_beginning = "<!-- BEGIN -->"
old_text_end = "<!-- END -->"
new_text = "just this"
#!end_fb2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_range-at-boundaries/boundaries.txt",
    "replacements": 1
  }
}
```

```
just this
```

### 016-nonexistent-file

```sh nesl
#!nesl [@three-char-SHA-256: nf1]
action = "file_replace_text_range"
path = "/tmp/t_nonexistent-file/does-not-exist.txt"
old_text_beginning = "[START]"
old_text_end = "[END]"
new_text = "content"
#!end_nf1
```

```json
{
  "success": false,
  "error": "ENOENT: no such file or directory, open '/tmp/t_nonexistent-file/does-not-exist.txt'"
}
```

### 017-partial-marker-overlap

```sh nesl
#!nesl [@three-char-SHA-256: po1]
action = "file_write"
path = "/tmp/t_partial-marker-overlap/partial.txt"
content = "BEGIN_MARKER some content that ends with MARKER suffix"
#!end_po1
```

```sh nesl
#!nesl [@three-char-SHA-256: po2]
action = "file_replace_text_range"
path = "/tmp/t_partial-marker-overlap/partial.txt"
old_text_beginning = "BEGIN_MARKER"
old_text_end = "MARKER"
new_text = "REPLACED"
#!end_po2
```

```json
{
  "success": true,
  "data": {
    "path": "/tmp/t_partial-marker-overlap/partial.txt",
    "replacements": 1
  }
}
```

```
REPLACED suffix
```