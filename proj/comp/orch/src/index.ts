import type { SlupeAction, ParseError } from '../../nesl-action-parser/src/index.js';
import { parseNeslResponse } from '../../nesl-action-parser/src/index.js';
import type { FileOpResult } from '../../fs-ops/src/index.js';
import { FsOpsExecutor } from '../../fs-ops/src/index.js';
import type { HooksConfig, HookContext, HookError, HookResult } from '../../hooks/src/index.js';
import { HooksManager } from '../../hooks/src/index.js';
import { FsGuard } from '../../fs-guard/src/index.js';
import { ExecExecutor } from '../../exec/src/index.js';


import { loadConfig } from '../../config/src/index.js';
import type { SlupeConfig } from '../../config/src/index.js';
import { updateInstructions } from '../../instruct-gen/src/index.js';
import { ActionDefinitions } from '../../../src/unified-design.js';

export interface ExecutionResult {
  success: boolean;
  totalBlocks: number;
  executedActions: number;
  results: ActionResult[];
  parseErrors: ParseError[];
  fatalError?: string;
  hookErrors?: {
    before?: HookError[];
    after?: HookError[];
  };
  afterHookContext?: HookContext;
  debug?: {
    parseDebug?: any;
  };
}

export interface ActionResult {
  seq: number;
  blockId: string;
  action: string;
  params: Record<string, any>;
  success: boolean;
  error?: string;
  data?: any;
}

export interface SlupeOptions {
  repoPath?: string;
  gitCommit?: boolean;
  hooks?: HooksConfig;
  enableHooks?: boolean;
}

export class Slupe {
  private constructor(
    private config: SlupeConfig,
    private executors: Map<string, (action: SlupeAction) => Promise<FileOpResult>>,
    private hooksManager: HooksManager | undefined,
    private repoPath: string
  ) { }

  static async create(options: SlupeOptions = {}): Promise<Slupe> {
    const repoPath = options.repoPath || process.cwd();

    // Load configuration
    console.time('loadConfig');
    const config = await loadConfig(repoPath);
    console.timeEnd('loadConfig');

    // Update instructions file if needed
    console.time('updateInstructions');
    await updateInstructions(repoPath, config['allowed-actions']);
    console.timeEnd('updateInstructions');

    // Initialize executors
    console.time('initializeExecutors');
    const executors = await Slupe.initializeExecutors(config, repoPath);
    console.timeEnd('initializeExecutors');

    // Initialize hooks if enabled
    let hooksManager: HooksManager | undefined;
    if (options.enableHooks !== false) {
      if (options.hooks) {
        // Use provided hooks configuration
        hooksManager = new HooksManager(options.hooks, undefined, repoPath);
      } else if (config.hooks) {
        // Use hooks from loaded config
        hooksManager = new HooksManager(config.hooks, config.vars, repoPath);
      }
    }

    return new Slupe(config, executors, hooksManager, repoPath);
  }

  /**
   * Parse and execute all NESL blocks in LLM output
   * Executes all valid actions sequentially, collecting both successes and failures
   */
  async execute(llmOutput: string): Promise<ExecutionResult> {
    const hookErrors: ExecutionResult['hookErrors'] = {};

    try {

      // Run before hooks
      if (this.hooksManager) {
        console.time('before-hooks');
        try {
          const beforeResult = await this.hooksManager.runBefore();
          if (!beforeResult.success) {
            // Before hook failure is fatal
            return {
              success: false,
              totalBlocks: 0,
              executedActions: 0,
              results: [],
              parseErrors: [],
              hookErrors: {
                before: beforeResult.errors || [{command: 'unknown', error: 'Unknown before hook error'}]
              },
              fatalError: 'Before hooks failed - aborting execution'
            };
          }
          console.timeEnd('before-hooks');
        } catch (error) {
          console.timeEnd('before-hooks');
          return {
            success: false,
            totalBlocks: 0,
            executedActions: 0,
            results: [],
            parseErrors: [],
            fatalError: `Before hooks threw unexpected error: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }

      // Parse NESL blocks
      console.time('parseNeslResponse');
      const parseResult = await parseNeslResponse(llmOutput);
      console.timeEnd('parseNeslResponse');

      // Debug info captured in parseResult.debug

      // Execute each valid action sequentially
      const results: ActionResult[] = [];
      let seq = 1;

      console.time('execute-all-actions');
      for (const action of parseResult.actions) {
        console.time(`execute-action-${seq}`);
        const result = await this.executeAction(action, seq++);
        console.timeEnd(`execute-action-${seq-1}`);
        results.push(result);
      }
      console.timeEnd('execute-all-actions');

      // Calculate execution success (before considering after hooks)
      const allActionsSucceeded = results.every(r => r.success);
      const noParseErrors = parseResult.errors.length === 0;
      const executionSuccess = allActionsSucceeded && noParseErrors;

      // Build after hook context (but don't run them)
      let afterHookContext: HookContext | undefined;
      if (this.hooksManager) {
        const modifiedFiles = new Set<string>();
        const operations: string[] = [];
        const errors: string[] = [];

        for (const result of results) {
          if (result.action.startsWith('file_') && result.params.path) {
            modifiedFiles.add(result.params.path);
          }

          operations.push(`${result.action}${result.success ? '' : ' (failed)'}`);

          if (!result.success && result.error) {
            errors.push(`${result.action}: ${result.error}`);
          }
        }

        afterHookContext = {
          success: executionSuccess,
          executedActions: results.length,
          totalBlocks: parseResult.summary.totalBlocks,
          modifiedFiles: Array.from(modifiedFiles).join(','),
          operations: operations.join(','),
          errors: errors.join('; '),
          errorCount: errors.length
        };
      }

      return {
        success: executionSuccess,
        totalBlocks: parseResult.summary.totalBlocks,
        executedActions: results.length,
        results,
        parseErrors: parseResult.errors,
        ...(Object.keys(hookErrors).length > 0 && { hookErrors }),
        ...(afterHookContext && { afterHookContext }),
        debug: {
          parseDebug: parseResult.debug
        }
      };

    } catch (error) {
      // Only truly unexpected errors should reach here
      return {
        success: false,
        totalBlocks: 0,
        executedActions: 0,
        results: [],
        parseErrors: [],
        fatalError: `Unexpected error in execute: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }



  /**
   * Initialize action executors with configuration
   */
  private static async initializeExecutors(config: SlupeConfig, repoPath: string): Promise<Map<string, (action: SlupeAction) => Promise<FileOpResult>>> {

    // Create fs-guard with config (loadConfig ensures fs-guard section always exists)
    const fsGuard = new FsGuard(config['fs-guard'], repoPath);

    // Create executors
    const fsOps = new FsOpsExecutor(fsGuard);
    const exec = new ExecExecutor();

    // Build routing table from TypeScript definitions
    const executors = new Map<string, (action: SlupeAction) => Promise<FileOpResult>>();
    const validActions = new Set<string>();

    for (const [actionName, actionDef] of Object.entries(ActionDefinitions)) {
      validActions.add(actionName);
      const executorName = (actionDef as any).executor || Slupe.inferExecutor(actionName, actionDef);

      switch (executorName) {
        case 'fs-ops':
          executors.set(actionName, (action) => fsOps.execute(action));
          break;
        case 'exec':
          executors.set(actionName, (action) => exec.execute(action));
          break;
        // Skip unimplemented executors
        case 'context':
        case 'git':
          break;
        default:
          console.warn(`Unknown executor: ${executorName} for action: ${actionName}`);
      }
    }

    // Validate allowed-actions against actual available tools
    for (const tool of config['allowed-actions']) {
      if (!validActions.has(tool)) {
        throw new Error(`Invalid action in allowed-actions: '${tool}'. Valid actions: ${Array.from(validActions).join(', ')}`);
      }
    }

    return executors;
  }

  /**
   * Infer executor from action name/type when not explicitly defined
   * Temporary fallback until all YAML entries have executor field
   */
  private static inferExecutor(actionName: string, _actionDef: any): string | null {
    // File/dir operations go to fs-ops
    if (actionName.startsWith('file_') || actionName.startsWith('files_') ||
      actionName.startsWith('dir_') || ['ls', 'grep', 'glob'].includes(actionName)) {
      return 'fs-ops';
    }

    // Exec operations
    if (actionName === 'exec') {
      return 'exec';
    }

    // Context operations (future)
    if (actionName.startsWith('context_')) {
      return 'context';
    }

    // Git operations (future)
    if (actionName.startsWith('git_') || actionName === 'undo') {
      return 'git';
    }

    return null;
  }

  /**
   * Run after hooks with the given context
   * Returns the hook result with any errors
   */
  async runAfterHooks(context: HookContext): Promise<HookResult> {
    if (!this.hooksManager) {
      return { success: true, executed: 0 };
    }

    try {
      return await this.hooksManager.runAfter(context);
    } catch (error) {
      return {
        success: false,
        executed: 0,
        errors: [{
          command: 'after hooks',
          error: `After hooks threw unexpected error: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Execute a single action and format the result
   * Never throws - all errors returned in ActionResult
   */
  private async executeAction(action: SlupeAction, seq: number): Promise<ActionResult> {
    if (!this.config['allowed-actions'].includes(action.action)) {
      return {
        seq,
        blockId: action.metadata.blockId,
        action: action.action,
        params: action.parameters,
        success: false,
        error: `Action '${action.action}' is not in allowed-actions list (${this.config['allowed-actions']})`
      };
    }

    const executor = this.executors.get(action.action);

    if (!executor) {
      return {
        seq,
        blockId: action.metadata.blockId,
        action: action.action,
        params: action.parameters,
        success: false,
        error: `Unknown action: ${action.action}`
      };
    }

    try {
      // Add default cwd for exec actions if not specified
      const enhancedAction = action.action === 'exec' && !action.parameters.cwd
        ? { ...action, parameters: { ...action.parameters, cwd: this.repoPath } }
        : action;

      const result = await executor(enhancedAction);

      const actionResult = {
        seq,
        blockId: action.metadata.blockId,
        action: action.action,
        params: action.parameters,
        success: result.success,
        ...(result.error && { error: result.error }),
        ...(result.data !== undefined && { data: result.data }),
        // Include exec-specific fields at top level
        ...(action.action === 'exec' && {
          data: {
            stdout: (result as any).stdout,
            stderr: (result as any).stderr,
            exit_code: (result as any).exit_code,
            command: action.parameters.code
          }
        })
      };

      // Debug exec errors
      if (action.action === 'exec' && !result.success) {
        console.log('DEBUG: Exec failed in orchestrator:', result);
      }

      return actionResult;

    } catch (error) {
      // Executors should never throw, but handle just in case
      return {
        seq,
        blockId: action.metadata.blockId,
        action: action.action,
        params: action.parameters,
        success: false,
        error: `Unexpected executor error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}