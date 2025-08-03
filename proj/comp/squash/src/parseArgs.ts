import { SquashOptions } from './types.js';

export function parseArgs(args: string[]): SquashOptions | null {
  if (args.includes('--help')) {
    showHelp();
    return null;
  }

  const options: SquashOptions = {
    containing: [],
    dryRun: args.includes('--dry-run'),
    push: args.includes('--push'),
    force: args.includes('--force')
  };

  let i = 0;
  while (i < args.length) {
    switch (args[i]) {
      case '--containing':
        if (i + 1 < args.length) {
          const val = args[i + 1];
          if (val !== undefined) {
            options.containing.push(val);
          }
          i++;
        }
        break;
      case '--limit':
        if (i + 1 < args.length) {
          const limitArg = args[i + 1];
          if (limitArg !== undefined) {
            const limit = parseInt(limitArg, 10);
            if (!isNaN(limit) && limit > 0) {
              options.limit = limit;
            }
          }
          i++;
        }
        break;
      case '--after':
        if (i + 1 < args.length) {
          options.after = args[i + 1];
          i++;
        }
        break;
      case '--message':
        if (i + 1 < args.length) {
          options.message = args[i + 1];
          i++;
        }
        break;
    }
    i++;
  }

  if (options.containing.length === 0) {
    options.containing = ['auto-slupe::'];
  }

  return options;
}

function showHelp(): void {
  console.log(`slupe-squash [options]

Options:
  --containing <string>   Match commits containing string (multiple=OR, ""=all)
                         Default: "auto-slupe::" if none specified
  --limit <number>       Max commits to squash from HEAD
  --after <date>         Only consider commits after ISO date
  --message <string>     Custom message (auto-generated if omitted)  
  --push                 Push to remote using --force-with-lease
  --force                With --push, use --force instead
  --dry-run              Preview without executing
  --help                 Show help`);
}