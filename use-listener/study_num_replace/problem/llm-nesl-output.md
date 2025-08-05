📋 Copied to clipboard

=== SLUPE RESULTS ===
fy1 ❌ replace_text_in_file /Users/stuart/repos/slupe/proj/comp/orch/src/createStarterConfig.ts - old_text not found in file
=== END ===

#!nesl [@three-char-SHA-256: fy1]
action = "replace_text_in_file"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/createStarterConfig.ts"
old_text = <<'EOT_fy1'
const STARTER_SLUPE_YML = `# Slupe configuration
version: 1
hooks:
  # Uncomment and modify these examples as needed
  
  # before:
  #   - run: git stash --include-untracked
  #     continueOnError: false
  
  # after:
  #   - run: git add -A
  #   - run: git commit -m "\${COMMIT_MSG}"
  #     continueOnError: false
  #   - run: git push
  #     continueOnError: true
  #     timeout: 10000  # 10s for slow networks
# Variables available in commands
vars:
  COMMIT_MSG: "AI-assisted changes"
  # Add more variables as needed
`;
EOT_fy1
new_text = <<'EOT_fy1'
const STARTER_SLUPE_YML = `# Slupe configuration
version: 1

hooks:
  before: []
    # Example: Stash changes before operations
    # - run: git stash --include-untracked
    #   continueOnError: false
  
  after: []
    # Example: Commit and push changes
    # - run: git add -A
    # - run: git commit -m "\${COMMIT_MSG}"
    #   continueOnError: false
    # - run: git push
    #   continueOnError: true
    #   timeout: 10000  # 10s for slow networks

# Variables available in commands
vars:
  COMMIT_MSG: "AI-assisted changes"
  # Add more variables as needed
`;
EOT_fy1
#!end_fy1