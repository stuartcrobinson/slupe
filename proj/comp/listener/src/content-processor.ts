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
}

export function stripSummarySection(content: string): string {
  const startMarker = '=== SLUPE RESULTS ===';
  const endMarker = '=== END ===';
  
  // Check if content starts with a SLUPE results section (with some tolerance for leading content)
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1 || startIndex > 100) {
    // No SLUPE section at the beginning of file
    return content;
  }
  
  // Find the corresponding END marker after the start
  const endIndex = content.indexOf(endMarker, startIndex);
  if (endIndex === -1) {
    return content; // Malformed section, keep content as-is
  }
  
  // Return content after the END marker, trimming leading whitespace
  return content.slice(endIndex + endMarker.length).trimStart();
}

export async function processContent(
  content: string,
  lastHash: string,
  debug?: boolean
): Promise<ProcessResult | null> {
  if (content.trim() === '') {
    return null;
  }

  const stripped = stripSummarySection(content);
  const hash = computeContentHash(stripped.trim());

  if (hash === lastHash) {
    console.log('DEBUG: Hash unchanged, skipping processing', { hash, lastHash });
    return null;
  }

  const slupe = await Slupe.create({ gitCommit: false });
  const orchResult = await slupe.execute(content);

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
    errors: orchResult.parseErrors
  };
}