
#!/bin/bash

output_file="snapshot_selections.txt"
copy_paths_mode=false
prepend_line_numbers=false

for arg in "$@"; do
  [[ "$arg" == "n" ]] && prepend_line_numbers=true
  [[ "$arg" == "p" ]] && copy_paths_mode=true
done


# /Users/stuart/repos/slupe/xd5_ref.md
# /Users/stuart/repos/slupe/replacer/replacer_llm_instructions.md


# /Users/stuart/repos/slupe/proj/comp/hooks/doc/ABSTRACT.md
# /Users/stuart/repos/slupe/proj/comp/hooks/doc/API.md
# /Users/stuart/repos/slupe/proj/comp/hooks/doc/ARCH.md
# /Users/stuart/repos/slupe/proj/comp/orch/doc/API.md




###### for working on fs-guard
# https://claude.ai/chat/50860d9f-c4eb-4b91-980c-522e89bdfc1c
# https://claude.ai/chat/3e2b39e8-e16b-4e73-bfa2-bb57a1ec744f
# proj/comp/fs-ops/src/index.ts
# proj/comp/exec/src/index.ts
# unified-design.yaml
# proj/comp/orch/src/index.ts
# xd5_ref.md

# proj/comp/fs-ops/test-data/integration/write_action_result/file_delete.cases.md proj/comp/fs-ops/test-data/integration/write_action_result/file_move.cases.md proj/comp/fs-ops/test-data/integration/write_action_result/file_read_numbered.cases.md proj/comp/fs-ops/test-data/integration/write_action_result/file_read.cases.md proj/comp/fs-ops/test-data/integration/write_action_result/files_read.cases.md
# proj/comp/listener/src/formatters.ts
# proj/comp/fs-ops/doc/ARCH.md

# proj/comp/fs-guard/doc/ABSTRACT.md proj/comp/fs-guard/doc/ARCH.md proj/comp/fs-guard/doc/TODO.md

# proj/comp/fs-guard/doc/adr/background.md



# proj/comp/orch/src/index.ts
# proj/comp/orch/src/createStarterConfig.ts
# proj/comp/fs-ops/src/index.ts
# proj/comp/exec/src/index.ts
# proj/comp/hooks/src/index.ts
# proj/comp/hooks/src/parseYamlConfig.ts
# proj/comp/hooks/src/validateConfig.ts
# unified-design.yaml
# proj/comp/fs-guard/doc/ABSTRACT.md proj/comp/fs-guard/doc/ARCH.md proj/comp/fs-guard/doc/TODO.md

# /Users/stuart/repos/slupe/proj/comp/orch/src/index.ts
# /Users/stuart/repos/slupe/proj/comp/fs-ops/src/index.ts
# /Users/stuart/repos/slupe/proj/comp/exec/src/index.ts
# /Users/stuart/repos/slupe/proj/comp/hooks/src/index.ts
# /Users/stuart/repos/slupe/proj/comp/fs-guard/src/index.ts
# /Users/stuart/repos/slupe/proj/comp/fs-guard/src/types.ts
# /Users/stuart/repos/slupe/proj/comp/fs-guard/src/FsGuard.ts
# /Users/stuart/repos/slupe/proj/comp/orch/src/loadConfig.ts
# /Users/stuart/repos/slupe/proj/comp/orch/src/types.ts
# /Users/stuart/repos/slupe/slupe.yml
# /Users/stuart/repos/slupe/proj/comp/fs-guard/test/unit/FsGuard.test.ts
# /Users/stuart/repos/slupe/proj/comp/fs-ops/test/integration/minimal.test.ts
# /Users/stuart/repos/slupe/proj/comp/orch/test/integration/fs-guard-integration.test.ts

# proj/comp/orch/src/types.ts
# proj/comp/fs-guard/src/types.ts
# proj/comp/fs-guard/src/FsGuard.ts
# proj/comp/fs-ops/src/index.ts
# proj/comp/exec/src/index.ts
# proj/comp/orch/src/loadConfig.ts
# proj/comp/orch/src/index.ts
# use-listener/instruct.md

# /Users/stuart/repos/slupe/proj/comp/orch/src/index.ts
# /Users/stuart/repos/slupe/proj/comp/hooks/test/integration/git-integration.test.ts
# /Users/stuart/repos/slupe/proj/comp/hooks/src/index.ts
# /Users/stuart/repos/slupe/proj/comp/orch/src/types.ts
# /Users/stuart/repos/slupe/proj/comp/orch/src/loadConfig.ts
# /Users/stuart/repos/slupe/proj/comp/hooks/test/integration/hooks-basic.test.ts
# /Users/stuart/repos/slupe/proj/comp/hooks/test/integration/hooks-abort.test.ts


# /Users/stuart/repos/slupe/proj/comp/orch/test/execute.test.ts
  
# proj/comp/fs-ops/src/index.ts 
# proj/comp/fs-ops/test/integration/write_action_result.test.ts
# proj/comp/fs-guard/tsconfig.json 
# package.json
# tsconfig.json

#  proj/comp/hooks/doc/ABSTRACT.md proj/comp/hooks/doc/API.md proj/comp/hooks/doc/ARCH.md proj/comp/orch/doc/API.md proj/comp/orch/doc/ARCH.md

#  /Users/stuart/repos/slupe/proj/comp/config/src/index.ts
# /Users/stuart/repos/slupe/proj/comp/config/src/load.ts
# /Users/stuart/repos/slupe/proj/comp/config/src/create.ts
# /Users/stuart/repos/slupe/proj/comp/config/src/types.ts
# /Users/stuart/repos/slupe/proj/comp/config/src/validate.ts
# /Users/stuart/repos/slupe/proj/comp/config/test/unit/load.test.ts
# /Users/stuart/repos/slupe/proj/comp/config/test/unit/create.test.ts
# /Users/stuart/repos/slupe/proj/comp/config/test/unit/validate.test.ts
# /Users/stuart/repos/slupe/proj/comp/orch/src/loadConfig.ts
# /Users/stuart/repos/slupe/proj/comp/orch/src/createStarterConfig.ts
# /Users/stuart/repos/slupe/proj/comp/orch/src/types.ts
# /Users/stuart/repos/slupe/proj/comp/hooks/src/parseYamlConfig.ts
# /Users/stuart/repos/slupe/proj/comp/hooks/src/validateConfig.ts
# /Users/stuart/repos/slupe/proj/comp/orch/src/index.ts
# /Users/stuart/repos/slupe/proj/comp/hooks/src/index.ts
# /Users/stuart/repos/slupe/proj/comp/hooks/test/integration/git-integration.test.ts
# /Users/stuart/repos/slupe/proj/comp/hooks/test/integration/hooks-basic.test.ts
# /Users/stuart/repos/slupe/proj/comp/hooks/test/integration/hooks-abort.test.ts
# /Users/stuart/repos/slupe/proj/comp/orch/doc/ARCH.md


file_list=$(cat <<'EOF'

/Users/stuart/repos/slupe/use-listener/instruct.md

/Users/stuart/repos/slupe/proj/comp/exec/src/executeCommand.ts
/Users/stuart/repos/slupe/proj/comp/exec/src/formatExecResult.ts
/Users/stuart/repos/slupe/proj/comp/exec/src/types.ts
/Users/stuart/repos/slupe/proj/comp/listener/src/formatters.ts
/Users/stuart/repos/slupe/proj/comp/exec/test/unit/executeCommand.test.ts
/Users/stuart/repos/slupe/proj/comp/exec/test/unit/formatExecResult.test.ts
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