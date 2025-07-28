import { ValidationResult, ActionDefinition } from './types.js';
import type { Block } from 'nesl-js';

/**
 * Validate a single NESL block against action schema
 * Checks action exists and required params present
 */
export function validateNeslBlock(
  block: Block,
  actionSchema: ActionDefinition | null
): ValidationResult {
  // Check if block has properties object
  if (!block.properties) {
    return {
      valid: false,
      errors: ['Block missing properties object']
    };
  }

  // Check if action field exists
  if (!block.properties.action) {
    return {
      valid: false,
      errors: ['Missing \'action\' field in NESL block']
    };
  }

  const actionType = block.properties.action;

  // If no schema provided, it's an unknown action
  if (!actionSchema) {
    return {
      valid: false,
      errors: [`Unknown action: ${actionType}`]
    };
  }

  // Check all required parameters are present
  const errors: string[] = [];

  if (actionSchema.parameters) {
    for (const [paramName, paramDef] of Object.entries(actionSchema.parameters)) {
      if (paramDef.required && !(paramName in block.properties)) {
        errors.push(`Missing required parameter: ${paramName}`);
      }
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors
    };
  }

  return {
    valid: true,
    actionType,
    errors: []
  };
}