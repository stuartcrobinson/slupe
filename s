
#!/bin/bash

output_file="snapshot_selections.txt"
copy_paths_mode=false
prepend_line_numbers=false

for arg in "$@"; do
  [[ "$arg" == "n" ]] && prepend_line_numbers=true
  [[ "$arg" == "p" ]] && copy_paths_mode=true
done


file_list=$(cat <<'EOF'


/Users/stuart/repos/slupe/proj/src/index.ts
/Users/stuart/repos/slupe/proj/src/cli.ts
/Users/stuart/repos/slupe/proj/comp/instruct-gen/src/loader.ts
/Users/stuart/repos/slupe/proj/comp/instruct-gen/src/parser.ts



EOF
)

# Extract, split, deduplicate while preserving order
# Normalize to absolute paths, then dedupe while preserving order
unique_files=$(echo "$file_list" | tr ' \n' '\n' | grep -v '^$' | xargs -I{} realpath "{}" | awk '!seen[$0]++')


# Count files
file_count=$(echo "$unique_files" | wc -l | tr -d ' ')

if $copy_paths_mode; then
  # Copy the list of file paths directly to clipboard
  echo "$unique_files" | xargs -I{} realpath "{}" | pbcopy
  echo "📋 Copied list of $file_count file paths to clipboard."
else
  echo "$unique_files" | while read -r file; do
    {
      echo "=== START FILE: $file ==="
      if $prepend_line_numbers; then
        nl -ba -n rn -s ':' -w 4 "$file"
      else
        cat "$file"
      fi

      echo
      echo "=== END FILE: $file ==="
      echo
    }
  done | tee "$output_file" | pbcopy
  echo "✅ Concatenated $file_count files into $output_file"
fi


# /Users/stuart/repos/slupe/replacer/replacer_llm_instructions.md
# /Users/stuart/repos/slupe/xd5_ref.md
# /Users/stuart/repos/slupe/unified-design.yaml
# # # # # # # # proj/comp/listener/src/errors.ts proj/comp/listener/src/formatters.ts proj/comp/listener/src/index.ts proj/comp/listener/src/listener.ts proj/comp/listener/src/types.ts proj/comp/listener/src/utils.ts proj/comp/listener/doc/ABSTRACT.md proj/comp/listener/doc/API.md proj/comp/listener/doc/ARCH.md proj/comp/listener/test/integration/listener-workflow.test.ts proj/comp/listener/test-data/integration/listener-workflow.md proj/comp/listener/test-data/startListener.json replacer/replacer_llm_instructions.md xd5_ref.md



# # # # # # # # /Users/stuart/repos/slupe/proj/comp/nesl-action-parser/doc/ABSTRACT.md
# # # # # # # # /Users/stuart/repos/slupe/proj/comp/nesl-action-parser/doc/API.md
# # # # # # # # /Users/stuart/repos/slupe/proj/comp/nesl-action-parser/doc/ARCH.md

# # # # # # # # /Users/stuart/repos/slupe/proj/comp/fs-ops/doc/ABSTRACT.md
# # # # # # # # /Users/stuart/repos/slupe/proj/comp/fs-ops/doc/API.md
# # # # # # # # /Users/stuart/repos/slupe/proj/comp/fs-ops/doc/ARCH.md

# # # # # # # # /Users/stuart/repos/slupe/proj/doc/API.md
# # # # # # # # /Users/stuart/repos/slupe/proj/doc/ARCH.md
# # # # # # # # /Users/stuart/repos/slupe/proj/doc/TODO.md

# https://claude.ai/chat/89fcf145-9202-4b4f-84db-322ae77a5449
# https://chatgpt.com/c/687f8e06-9f44-8324-b817-4536ca8c3b9c