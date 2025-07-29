
=== SLUPE RESULTS ===
x9k ✅ file_replace_text /Users/stuart/repos/slupe/proj/src/index.ts
m7p ✅ file_replace_text /Users/stuart/repos/slupe/proj/src/index.ts
=== END ===

I can see the issue in your `proj/src/index.ts` file. You have the `showHelp` function declared twice (lines 8 and 24), which is causing the TypeScript compilation error.

Here's the fix:

```sh nesl
#!nesl [@three-char-SHA-256: x9k]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/src/index.ts"
old_text = <<'EOT_x9k'
`);
}

function showHelp(): void {
  console.log(`Usage: slupe [options]

Options:
  --clipboard              Enable clipboard copy on execution
  --input_file <path>      Input file path (default: slupe_input.md)
  --output_file <path>     Output file path (default: .slupe_output.md)
  --help                   Show this help message

Config file options (slupe.yml):
  clipboard: boolean       Enable clipboard by default
  input_file: string       Default input file path
  output_file: string      Default output file path
`);
}

async function main(): Promise<void> {
EOT_x9k
new_text = <<'EOT_x9k'
`);
}

async function main(): Promise<void> {
EOT_x9k
#!end_x9k
```

Also, I notice you have the help check duplicated as well. Let's fix that:

```sh nesl
#!nesl [@three-char-SHA-256: m7p]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/src/index.ts"
old_text = <<'EOT_m7p'
  if (args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('--help')) {
    showHelp();
    process.exit(0);
  }
EOT_m7p
new_text = <<'EOT_m7p'
  if (args.includes('--help')) {
    showHelp();
    process.exit(0);
  }
EOT_m7p
#!end_m7p
```

These changes remove the duplicate `showHelp` function declaration and the duplicate help argument check.