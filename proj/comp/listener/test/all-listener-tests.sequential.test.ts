import { describe } from 'vitest';

// Import test functions from component test files
import { stopListenerTests } from './unit/stopListener.test.ts';
import { listenerWorkflowTests } from './integration/listener-workflow-v2.test.ts';

// Run all listener tests in sequence within this single file
describe('All Listener Tests (Sequential)', () => {
  describe('stopListener', () => {
    stopListenerTests();
  });
  
  describe('listener-workflow-v2', async () => {
    await listenerWorkflowTests();
  });
});