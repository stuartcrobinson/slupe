## slupe-squash Component Design

### Purpose
Squash recent contiguous git commits matching specified patterns. Primary use: consolidating automated commits from slupe tool.

### Binary Entry Point
Add to `package.json`:
```json
"bin": {
  "slupe": "dist/src/index.js",
  "slupe-squash": "dist/src/squash.js"
}
```

Create `proj/src/squash.ts`:
```typescript
#!/usr/bin/env node
import { squash } from '../comp/squash/src/index.js';
squash().catch(console.error);
```

### CLI Interface
```bash
slupe-squash [options]

Options:
  --containing <string>   Match commits containing string (multiple allowed, OR logic)
                         Default: "auto-slupe::"
  --after <date>         Only consider commits after ISO date
  --message <string>     Custom squash commit message (auto-generated if omitted)  
  --push                 Push to remote after squashing (uses --force-with-lease)
  --force                With --push, use --force instead of --force-with-lease
  --dry-run              Show what would be squashed without doing it
  --help                 Show help
```

### Component Structure
```
proj/comp/squash/
├── src/
│   ├── index.ts           # Main entry point
│   ├── types.ts           # SquashOptions, GitCommit interfaces
│   ├── parseArgs.ts       # CLI argument parsing
│   ├── findCommits.ts     # Find matching contiguous commits
│   ├── performSquash.ts   # Execute git rebase
│   ├── generateMessage.ts # Auto-generate commit messages
│   └── pushChanges.ts     # Handle remote push with safety checks
└── test/
    ├── unit/
    │   ├── parseArgs.test.ts
    │   ├── findCommits.test.ts
    │   └── generateMessage.test.ts
    └── integration/
        └── squash.test.ts
```

### Key Algorithms

**Finding commits:**
1. Use `git.log()` with `--grep` for each `--containing` value
2. Sort by date descending
3. Take while contiguous and matching
4. Require minimum 2 commits

**Auto-message generation:**
```
"Squashed N commits (YYYY-MM-DD to YYYY-MM-DD): modified X files"
- List files if ≤10: "file1.ts, file2.yml, file3.md"  
- Otherwise: "file1.ts, file2.yml, ... and N more files"
```

**Squashing:**
1. Get SHA of commit before oldest to squash
2. `git.rebase(['-i', baseSHA])` with editor script
3. Handle conflicts by aborting

**Push safety:**
1. Check if commits exist on remote: `git.log('origin/branch..HEAD')`
2. If `--push` without `--force`, use `git.push(['--force-with-lease'])`
3. If `--push --force`, use `git.push(['--force'])`

### Dependencies
Add to package.json:
```json
"dependencies": {
  "simple-git": "^3.28.0"
}
```

### Critical Edge Cases
- No matching commits: Exit with clear message
- Non-contiguous matches: Only squash most recent block
- Merge commits in range: Skip with warning
- Already pushed commits: Warn before force-pushing
- Rebase conflicts: Abort and inform user
- Remote diverged: `--force-with-lease` will fail (good)

### Integration Points
- Use same config loader as main slupe (if applicable)
- Share typescript/build configuration
- Add to .gitignore patterns if needed

You're correct. The CLI parsing should work as:
- No `--containing` flag → use default `["auto-slupe::"]`
- Any `--containing` flags → use only those values (ignore default)

So `--containing=""` gives `[""]` which matches all commits.

## Final Design Adjustments

**CLI:**
```bash
--containing <string>   # Can be empty string ""
--limit <number>        # Max commits to squash (safety valve)
--after <date>         
--message <string>     
--push                 
--force                
--dry-run              
```

**Limit behavior:**
- Counts from HEAD backward
- If more matching commits exist beyond limit, squash only the most recent N
- Warning: "Squashed 20 commits (limit reached, 5 more match criteria)"

## Test Additions

**Test 3: Limit enforcement**
- Create 10 auto commits
- Run with `--limit=5`
- Verify only squashes most recent 5
- Verify message indicates truncation

**Test 4: Multiple containing patterns**
- Commits: "feat: X", "auto-slupe::", "fix: Y", "auto-slupe::"
- Run: `--containing="feat:" --containing="fix:"`
- Verify squashes only feat+fix (not auto-slupe)