import { Slupe } from '../../orch/src/index.js';
import { formatSummary, formatFullOutput } from './formatters.js';
import { computeContentHash } from './utils.js';

export interface ProcessResult {
  summary: string;
  fullOutput: string;
  hash: string;
  originalContent: string;
  executedActions?: number;
  errors?: any[];
  slupeInstance?: any;
  afterHookContext?: any;
}

export function stripSummarySection(content: string): string {
  const startMarker = '=== SLUPE RESULTS ===';
  const endMarker = '=== END ===';
  
  const trimmed = content.trimStart();
  
  if (!trimmed.startsWith(startMarker)) {
    return content;
  }
  
  const endIndex = content.indexOf(endMarker);
  if (endIndex === -1) {
    return content;
  }
  
  return content.slice(endIndex + endMarker.length).trimStart();
}

export function hasExistingSlupeResults(content: string): boolean {
  return content.trimStart().startsWith('=== SLUPE RESULTS');
}

export async function processContent(
  content: string,
  lastHash: string,
  debug?: boolean,
  repoPath?: string,
  slupeInstance?: any
): Promise<ProcessResult | null> {
  // console.log('DEBUG processContent called with:', { 
  //   contentLength: content.length, 
  //   lastHash,
  //   contentPreview: content.substring(0, 50)
  // });
  
  if (content.trim() === '') {
    // console.log('DEBUG: Empty content, returning null');
    return null;
  }

  if (hasExistingSlupeResults(content)) {
    // console.log('DEBUG: File already has SLUPE results, skipping processing');
    return null;
  }

  const stripped = stripSummarySection(content);
  const hash = computeContentHash(stripped.trim());

  let slupe = slupeInstance;
  if (!slupe) {
    if (debug) console.time('slupe-create');
    slupe = await Slupe.create({ 
      gitCommit: false,
      repoPath 
    });
    if (debug) console.timeEnd('slupe-create');
  }
  
  if (debug) console.time('slupe-execute');
  const orchResult = await slupe.execute(content);
  if (debug) console.timeEnd('slupe-execute');

  if (debug) {
    console.log('\n=== DEBUG: Orchestrator Result ===');
    console.log('Executed actions:', orchResult.executedActions);
    console.log('Results:', orchResult.results?.length || 0);
    console.log('Parse errors:', orchResult.parseErrors?.length || 0);
    if (orchResult.parseErrors && orchResult.parseErrors.length > 0) {
      console.log('Raw parseErrors:', JSON.stringify(orchResult.parseErrors, null, 2));
    }

    if (orchResult.debug?.parseDebug) {
      const pd = orchResult.debug.parseDebug;
      console.log('\n--- Parse Debug ---');
      console.log('Input:', pd.rawInput);
      console.log('Parse result:', {
        blocks: pd.rawParseResult?.blocks?.length || 0,
        errors: pd.rawParseResult?.errors?.length || 0
      });
      if (pd.rawParseResult?.errors?.length > 0) {
        console.log('Nesl-js errors:', JSON.stringify(pd.rawParseResult.errors, null, 2));
      }
    }
    console.log('=== END DEBUG ===\n');
  }

  const summary = formatSummary(orchResult);
  const fullOutput = await formatFullOutput(orchResult);

  return {
    summary,
    fullOutput,
    hash,
    originalContent: content,
    executedActions: orchResult.executedActions,
    errors: orchResult.parseErrors,
    slupeInstance: slupe,
    afterHookContext: orchResult.afterHookContext
  };
}