import test from 'node:test';
import assert from 'node:assert/strict';
import { startTestBackend } from '@backstage/backend-test-utils';
import request from 'supertest';

// Set before importing the plugin: Task 6 makes plugin init require this key.
process.env.GEMINI_API_KEY = 'test-key';
const { contextRouterPlugin } = await import('../src/plugin.ts');

test('backend starts with the context-router plugin registered', async (t) => {
  const backend = await startTestBackend({ features: [contextRouterPlugin] });
  // Required: startTestBackend leaves a listening server that keeps the event loop
  // alive, so without this the suite passes and then hangs forever instead of exiting.
  t.after(() => backend.stop());

  const response = await request(backend.server).get('/api/context-router/health');
  assert.equal(response.status, 200);
});
