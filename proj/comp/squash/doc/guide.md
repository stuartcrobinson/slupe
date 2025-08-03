## slupe-squash Component Design

### Purpose
Squash recent contiguous git commits into single commit. Primary use: consolidating automated commits.

### Installation
Add to `package.json`:
```json
"bin": {
  "slupe": "dist/src/index.js",
  "slupe-squash": "dist/src/squash.js"
},
"dependencies": {
  "simple-git": "^3.28.0"
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
  --containing <string>   Match commits containing string (multiple=OR, ""=all)
                         Default: "auto-slupe::" if none specified
  --limit <number>       Max commits to squash from HEAD
  --after <date>         Only consider commits after ISO date
  --message <string>     Custom message (auto-generated if omitted)  
  --push                 Push to remote using --force-with-lease
  --force                With --push, use --force instead
  --dry-run              Preview without executing
  --help                 Show help
```

### Component Structure
```
proj/comp/squash/
├── src/
│   ├── index.ts           # Main entry, orchestration
│   ├── types.ts           # SquashOptions, GitCommit interfaces
│   ├── parseArgs.ts       # CLI parsing, validation
│   ├── findCommits.ts     # Identify contiguous matches from HEAD
│   ├── performSquash.ts   # Interactive rebase execution
│   ├── generateMessage.ts # Auto-message from file changes
│   └── pushChanges.ts     # Remote push with safety
└── test/
    └── integration/
        └── squash.test.ts # Real git operations
```

### Core Logic

**Commit Selection:**
1. Get commits newest-first: `git.log(['--grep=pattern', '--after=date'])`
2. Take while contiguous AND matching patterns AND under limit
3. Stop at first non-match or limit
4. Require minimum 2 commits or exit

**Pattern Matching:**
- No `--containing` → use `["auto-slupe::"]`
- With `--containing` → use provided values only
- Multiple patterns → match ANY (OR logic)
- Empty string `""` → match ALL commits

**Auto-Message:**
```
"Squashed N commits (YYYY-MM-DD to YYYY-MM-DD): modified X files"
```
- Get files via `git.log(['--name-only'])`
- Deduplicate with Set
- List if ≤10 files, else "file1, file2, ... and N more"

**Squash Execution:**
1. Identify base commit (parent of oldest to squash)
2. Interactive rebase: `git.rebase(['-i', baseSHA])`
3. Programmatically set all but first to 'squash'
4. On conflict → abort, exit with error

**Push Safety:**
- Default: Local only
- `--push`: Use `git.push(['--force-with-lease'])`
- `--push --force`: Use `git.push(['--force'])`
- Check unpushed: `git.log(['origin/branch..HEAD'])`

### Integration Tests

**Test 1: Basic squash**
```
Setup: manual₁ → auto₁ → auto₂ → auto₃ (HEAD)
Run: slupe-squash
Verify: manual₁ → squashed(auto₁₊₂₊₃)
```

**Test 2: Push mechanics**
```
Setup: Local + remote repos, pushed commits + new local commits
Test: --push succeeds, normal push fails
Test: Remote divergence → --force-with-lease fails
```

**Test 3: Edge cases**
```
- Empty string matches all
- Limit truncation with warning
- No matches → clear error message
```

### Error Handling
- No matching commits → Exit 0, message: "No matching commits found"
- Non-contiguous at HEAD → Exit 0, message: "Most recent commit doesn't match"
- Rebase conflicts → Exit 1, message: "Rebase failed, aborted"
- Push rejected → Exit 1, show git error

### Limitations
- Only squashes from HEAD backwards
- Cannot squash "islands" of commits
- Merge commits skipped
- No support for multiple branches simultaneously