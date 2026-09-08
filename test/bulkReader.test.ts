import test from 'node:test';
import assert from 'node:assert/strict';
import { startTestBackend } from '@backstage/backend-test-utils';
import request from 'supertest';

process.env.GEMINI_API_KEY = 'test-key';
const { contextRouterPlugin } = await import('../src/plugin.ts');

const BULK_READER_SYSTEM_PROMPT =
  'You are a precise code analyst. Read the provided files (enclosed in XML tags) and answer the user\'s query concisely. Output structured bullet points only. Do not use greetings, prose, or preambles. Lead every bullet with the exact file name, method type, or line number. Use nested bullets for details. Skip any information the caller did not explicitly ask for.';

test('POST /api/context-router/modes/bulk-reader wraps files in XML and returns the worker summary', async (t) => {
  const originalFetch = globalThis.fetch;
  let capturedBody: any;
  globalThis.fetch = (async (_url: string, init: any) => {
    capturedBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({ candidates: [{ content: { parts: [{ text: '- widget.ts: exports renderWidget()' }] } }] }),
      { status: 200 },
    );
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const backend = await startTestBackend({ features: [contextRouterPlugin] });
  t.after(() => backend.stop());

  const response = await request(backend.server)
    .post('/api/context-router/modes/bulk-reader')
    .send({
      query: 'what does this file export?',
      files: [{ path: 'widget.ts', content: 'export function renderWidget() {}' }],
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.summary, '- widget.ts: exports renderWidget()');
  assert.equal(capturedBody.systemInstruction.parts[0].text, BULK_READER_SYSTEM_PROMPT);
  assert.match(capturedBody.contents[0].parts[0].text, /<file path="widget\.ts">/);
  assert.match(capturedBody.contents[0].parts[0].text, /export function renderWidget/);
});

test('POST /api/context-router/modes/bulk-reader rejects an empty files array with 400', async (t) => {
  const backend = await startTestBackend({ features: [contextRouterPlugin] });
  t.after(() => backend.stop());

  const response = await request(backend.server)
    .post('/api/context-router/modes/bulk-reader')
    .send({ query: 'x', files: [] });
  assert.equal(response.status, 400);
});
