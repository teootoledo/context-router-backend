import test from 'node:test';
import assert from 'node:assert/strict';
import { callGemini } from '../src/geminiClient.ts';

test('callGemini posts the system prompt and content, returns the model text', async (t) => {
  const originalFetch = globalThis.fetch;
  let capturedUrl: string | undefined;
  let capturedHeaders: any;
  let capturedBody: any;
  globalThis.fetch = (async (url: string, init: any) => {
    capturedUrl = url.toString();
    capturedHeaders = init.headers;
    capturedBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: '- exports renderWidget()' }] } }],
      }),
      { status: 200 },
    );
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const result = await callGemini({
    apiKey: 'test-key',
    systemPrompt: 'You are a precise code analyst.',
    userContent: '<file path="widget.ts">export function renderWidget() {}</file>',
  });

  assert.equal(result, '- exports renderWidget()');
  assert.match(capturedUrl!, /gemini-3\.6-flash/);
  // The credential travels as a header, never in the URL: query strings are routinely
  // captured by proxies, access logs, and tracing tools that redact headers by default.
  assert.equal(capturedHeaders['x-goog-api-key'], 'test-key');
  assert.doesNotMatch(capturedUrl!, /test-key/);
  assert.equal(capturedBody.systemInstruction.parts[0].text, 'You are a precise code analyst.');
  assert.equal(
    capturedBody.contents[0].parts[0].text,
    '<file path="widget.ts">export function renderWidget() {}</file>',
  );
});

test('callGemini throws on a non-2xx response', async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response('rate limited', { status: 429 })) as typeof fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(() =>
    callGemini({ apiKey: 'test-key', systemPrompt: 'x', userContent: 'y' }),
  );
});

test('callGemini throws when a 200 response has no candidate text', async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ candidates: [] }), { status: 200 })) as typeof fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => callGemini({ apiKey: 'test-key', systemPrompt: 'x', userContent: 'y' }),
    /missing candidate text/,
  );
});
