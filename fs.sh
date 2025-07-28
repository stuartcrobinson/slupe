# https://claude.ai/chat/7beca23f-49af-4345-b5ef-10fa98b9dded
# run:
# ./fs

# find nesl21 -type f -not -name "package-lock.json"  -not -path "*/node_modules/*"  -exec sh -c 'echo; echo "=== START FILE: $1 ==="; cat "$1"; echo; echo "\n=== END FILE: $1 ==="' _ {} \; | pbcopy
# find . -type f -not -name "package-lock.json"  -not -path "*/node_modules/*"  -exec sh -c 'echo; echo "=== START FILE: $1 ==="; cat "$1"; echo; echo "\n=== END FILE: $1 ==="' _ {} \; | pbcopy

# find . -type f -not -name "package-lock.json"  -not -name "snapshot.txt"  -not -path "*/node_modules/*" -exec sh -c '
#   echo;
#   echo "=== START FILE: $1 ===";
#   cat "$1";
#   echo;
#   echo "=== END FILE: $1 ==="
# ' sh {} \; | tee snapshot.txt > /dev/null



echo "=== 'pwd' ==="
pwd
echo -e "\n=== nesl21/ contents ('find nesl21 ...') ==="
find nesl21 -not -path "*/node_modules/*" -not -path "*/.*/*" -not -path "*/trash/*" | sort | sed 's|[^/]*/|- |g' | sed 's|- |  |' | sed 's|^ *||'
echo -e "\n=== 'ls -1' ==="
ls -1
echo -e "\n=== 'cat replacer/replacer_llm_instructions.md' ==="
cat replacer/replacer_llm_instructions.md
echo ''
echo "=== 'pwd' ==="
pwd