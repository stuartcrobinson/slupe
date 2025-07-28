import { describe } from 'vitest';

// Import test functions from component test files
import { stopListenerTests } from './unit/stopListener.test.js';
import { listenerWorkflowTests } from './integration/listener-workflow-v2.test.js';

// Run all listener tests in sequence within this single file
describe('All Listener Tests (Sequential)', () => {
  describe('stopListener', () => {
    stopListenerTests();
  });
  
  describe('listener-workflow-v2', async () => {
    await listenerWorkflowTests();
  });
});