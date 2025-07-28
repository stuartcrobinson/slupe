#!/bin/bash

# Fix all handler files
for file in /Users/stuart/repos/slupe/proj/comp/fs-ops/src/actions/*.ts; do
  if [[ "$file" == *"file_write.ts" ]]; then
    continue  # Already fixed
  fi
  
  # Remove FsGuard import
  sed -i '' "/import type { FsGuard } from/d" "$file"
  
  # Remove guard parameter from function signature
  sed -i '' 's/guard: FsGuard, //g' "$file"
done

echo "Handler files updated"