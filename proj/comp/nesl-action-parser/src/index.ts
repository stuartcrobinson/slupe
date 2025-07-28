/**
 * NESL Action Parser - Parses NESL blocks into validated slupe actions
 */

import { ParseResult, SlupeAction, ParseError, ValidationResult, TransformError, ActionDefinition } from './types.js';
import { validateNeslBlock } from './validateNeslBlock.js';
import { transformToAction } from './transformToAction.js';
import { parseNesl, type Block, type ParseResult as NeslParseResult } from 'nesl';

// Re-export types for consumers
export type { ParseResult, SlupeAction, ParseError, ValidationResult, TransformError };

// Cache for action schema
let actionSchemaCache: Map<string, ActionDefinition> | null = null;

/**
 * Clear the action schema cache - useful for testing
 * Forces reload of action definitions on next parse
 */
export function clearActionSchemaCache(): void {
  actionSchemaCache = null;
}

/**
 * Parse NESL blocks from text into validated slupe actions
 * Processes all blocks, collecting successes and errors
 */
export async function parseNeslResponse(neslText: string): Promise<ParseResult> {
  const actions: SlupeAction[] = [];
  const errors: ParseError[] = [];

  // Debug logging for specific test cases
  // const isDebugging = neslText.includes('move-to-existing-file');
  // if (isDebugging) {
  //   console.log('DEBUG parseNeslResponse: Input text length:', neslText.length);
  //   console.log('DEBUG parseNeslResponse: Contains NESL blocks:', neslText.includes('#!NESL'));
  //   console.log('DEBUG parseNeslResponse: Number of #!nesl occurrences:', (neslText.match(/#!NESL/g) || []).length);
  //   console.log('DEBUG parseNeslResponse: Number of #!END_NESL occurrences:', (neslText.match(/#!END_NESL/g) || []).length);
  // }

  // Parse NESL blocks using nesl-js
  let parseResult: NeslParseResult;
  const debugInfo = {
    inputLength: neslText.length,
    containsNESL: neslText.includes('#!NESL'),
    inputPreview: neslText.substring(0, 600)
  };

  try {
    parseResult = parseNesl(neslText);

    // console.log('\n=== DEBUG: parseNesl output ===');
    // console.log('Blocks found:', parseResult?.blocks?.length || 0);
    // console.log('Errors found:', parseResult?.errors?.length || 0);
    // if (parseResult?.errors?.length > 0) {
    //   console.log('Parse errors:', JSON.stringify(parseResult.errors, null, 2));
    // }
    // if (parseResult?.blocks?.length > 0) {
    //   console.log('First block:', JSON.stringify(parseResult.blocks[0], null, 2));
    // }
    // console.log('=== END DEBUG ===\n');

    // if (isDebugging) {
    //   console.log('DEBUG parseNeslResponse: parseNesl returned:', parseResult);
    //   if (parseResult) {
    //     console.log('DEBUG parseNeslResponse: blocks:', parseResult.blocks?.length || 0);
    //     console.log('DEBUG parseNeslResponse: errors:', parseResult.errors?.length || 0);
    //   }
    // }

    // Handle case where parseNesl returns undefined or null
    if (!parseResult) {
      parseResult = { blocks: [], errors: [] };
    }
  } catch (error) {
    return {
      actions: [],
      errors: [{
        blockId: 'unknown',
        errorType: 'syntax',
        message: `Failed to parse NESL: ${error}`,
        neslContent: neslText
      }],
      summary: {
        totalBlocks: 0,
        successCount: 0,
        errorCount: 1
      }
    };
  }

  // Process syntax errors from nesl-js parser
  if (parseResult.errors && parseResult.errors.length > 0) {
    for (const parseError of parseResult.errors) {
      // Find the block this error belongs to
      const block = parseResult.blocks?.find(b => b.id === parseError.blockId);

      errors.push({
        blockId: parseError.blockId || 'unknown',
        action: block?.properties?.action,
        errorType: 'syntax',
        message: parseError.message,
        blockStartLine: block?.startLine || parseError.line,
        neslContent: parseError.context
          ? `#!nesl [@three-char-SHA-256: ${parseError.blockId}]\n${parseError.context}`.trimEnd()
          : reconstructNeslBlock(block || { id: parseError.blockId || 'unknown', properties: {}, startLine: 0, endLine: 0 })
      });
    }
  }

  // Load action schema
  const actionSchema = await loadActionSchema();

  // Process each NESL block
  const blocks = parseResult.blocks || [];

  // If no blocks found, return with any syntax errors collected
  if (blocks.length === 0) {
    return {
      actions: [],
      errors: errors,  // Keep any syntax errors we collected
      summary: {
        totalBlocks: 0,
        successCount: 0,
        errorCount: errors.length
      }
    };
  }

  // Track blocks with syntax errors to skip them
  const blocksWithSyntaxErrors = new Set(
    parseResult.errors?.map(e => e.blockId) || []
  );

  for (const block of blocks) {
    const blockId = block.id || 'unknown';

    // Skip blocks that already have syntax errors
    if (blocksWithSyntaxErrors.has(blockId)) {
      continue;
    }

    try {
      // Get action type from block
      const actionType = block.properties?.action;
      const actionDef = actionType ? actionSchema.get(actionType) : undefined;



      // Validate block
      const validation = validateNeslBlock(block, actionDef ?? null);

      if (!validation.valid) {
        errors.push({
          blockId,
          action: actionType,
          errorType: 'validation',
          message: validation.errors?.[0] || 'Validation failed',
          blockStartLine: block.startLine,
          neslContent: reconstructNeslBlock(block)
        });
        continue;
      }

      // Transform to action
      try {
        const action = transformToAction(block, actionDef!);
        actions.push(action);
      } catch (error) {
        if (error instanceof TransformError) {
          errors.push({
            blockId,
            action: actionType,
            errorType: 'type',
            message: error.message,
            blockStartLine: block.startLine,
            neslContent: reconstructNeslBlock(block)
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      errors.push({
        blockId,
        action: block.properties?.action,
        errorType: 'validation',
        message: `Unexpected error: ${error}`,
        blockStartLine: block.startLine,
        neslContent: reconstructNeslBlock(block)
      });
    }
  }

  const result = {
    actions,
    errors,
    summary: {
      totalBlocks: blocks.length,
      successCount: actions.length,
      errorCount: errors.length
    },
    debug: {
      rawInput: debugInfo,
      rawParseResult: parseResult
    }
  };
  return result;
}

/**
 * Load and cache action definitions
 */
async function loadActionSchema(): Promise<Map<string, ActionDefinition>> {

  if (actionSchemaCache) {
    return actionSchemaCache;
  }

  try {
    // Import from TypeScript source
    const { ActionDefinitions } = await import('../../../src/unified-design.js');

    actionSchemaCache = new Map();

    // Transform to parser's expected format
    for (const [toolName, toolDef] of Object.entries(ActionDefinitions)) {
      actionSchemaCache.set(toolName, {
        type: toolDef.type,
        description: toolDef.description,
        parameters: toolDef.parameters || {},
        returns: toolDef.returns
      } as ActionDefinition);
    }

    return actionSchemaCache;
  } catch (error) {
    throw new Error(`Failed to load action definitions: ${error}`);
  }
}

/**
 * Reconstruct NESL block text for error context
 */
function reconstructNeslBlock(block: Block): string {
  const lines: string[] = [];

  // Start line
  lines.push(`#!nesl [@three-char-SHA-256: ${block.id || 'unknown'}]`);

  // Properties
  for (const [key, value] of Object.entries(block.properties || {})) {
    if (key.startsWith('@')) continue; // Skip annotations

    if (typeof value === 'string' && value.includes('\n')) {
      // Multi-line value with heredoc
      lines.push(`${key} = <<'EOT_${block.id}'`);
      lines.push(value);
      lines.push(`EOT_${block.id}`);
    } else {
      // Single line value - use JSON.stringify to handle quotes properly
      lines.push(`${key} = ${JSON.stringify(value)}`);
    }
  }

  // End line
  lines.push(`#!end_${block.id || 'unknown'}`);

  return lines.join('\n');
}

// Re-export functions for consumers
export { validateNeslBlock, transformToAction };