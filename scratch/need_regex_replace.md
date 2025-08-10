Yes, two other test files need the same mock guard fix:

```bash
cd /Users/stuart/repos/slupe/proj/comp/fs-ops/test
grep -l "async check(action)" *.ts integration/*.ts unit/*.ts 2>/dev/null
```

These files have the old mock pattern:
- `test/integration/write_replace_result_contents.test.ts`
- `test/integration/write_result_contents.test.ts`

Fix with sed:

```bash
cd /Users/stuart/repos/slupe/proj/comp/fs-ops/test

# Fix the mock guard pattern
sed -i '' 's/async check(action)/async checkPath(path: string, mode: '\''read'\'' | '\''write'\'')/' integration/write_replace_result_contents.test.ts integration/write_result_contents.test.ts

# Add 'as any' to the mock guard objects
sed -i '' 's/^};$/} as any;/' integration/write_replace_result_contents.test.ts integration/write_result_contents.test.ts
```

Also need to check `formatNodeError.test.ts` - it imports a non-existent `utils.js`:

```bash
# Check what formatNodeError actually needs
grep -n "formatNodeError" test/unit/formatNodeError.test.ts
```

That function was likely moved into fs-io during the refactor. Either:
1. Skip/disable this test if the function no longer exists
2. Update import path if it moved

The debug tests (`debug-*.test.ts`, `trace-append.test.ts`) also have old mocks but appear to be temporary debugging - consider deleting them after fixing main tests.

----


No, NESL couldn't handle this elegantly. Here's why:

## Pattern matching limitations

NESL's `replace_text_in_file` requires exact string matches. The sed command uses regex to match:
- `async check(action)` with any whitespace variations
- The closing `};` at end of mock object

In NESL, you'd need:
1. Read each file
2. Find exact text including whitespace
3. Hope there's only one occurrence
4. Replace precisely

## Multiple replacements

The sed command makes two passes:
1. Replace method signature
2. Add `as any` to closing brace

NESL would need two separate actions per file, doubling the verbosity.

## Regex escaping nightmare

The sed pattern `'read' | 'write'` with nested quotes would be painful in NESL heredocs. You'd fight quote escaping in both the old_text and new_text blocks.

## Example of NESL attempt

```sh nesl
#!nesl [@three-char-SHA-256: fix]
action = "replace_text_in_file"
path = "/Users/stuart/repos/slupe/proj/comp/fs-ops/test/integration/write_replace_result_contents.test.ts"
old_text = <<'EOT_fix'
const mockGuard: FsGuard = {
  async check(action) {
    return { allowed: true };
  }
};
EOT_fix
new_text = <<'EOT_fix'
const mockGuard: FsGuard = {
  async checkPath(path: string, mode: 'read' | 'write') {
    return { allowed: true };
  }
} as any;
EOT_fix
#!end_fix
```

This works IF the whitespace matches exactly. But if there's an extra space or tab, it fails. Sed's regex handles variations.

## When to use each

- **sed/grep/awk**: Pattern-based bulk changes, especially with regex
- **NESL**: Precise known replacements, file creation, structured edits

NESL needs a `replace_pattern_in_file` action with regex support for these cases.