const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';

export async function callGemini(opts: {
  apiKey: string;
  systemPrompt: string;
  userContent: string;
}): Promise<string> {
  const res = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    // The key goes in a header, never the URL — see the test for why.
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.systemPrompt }] },
      contents: [{ parts: [{ text: opts.userContent }] }],
      generationConfig: {
        // Caps response size so a runaway summary can't re-inflate the caller's
        // context — the whole point of this product is to keep tokens down.
        maxOutputTokens: 2048,
        // Gemini 3.6 Flash is a thinking model with a dynamic thinking budget by
        // default, billed at a higher rate, and (unlike 2.5 Flash) rejects
        // thinkingBudget: 0 outright. This is a bullet-point summarization task
        // with no need for extended reasoning, so pin the budget to the API's
        // minimum instead of disabling it.
        thinkingConfig: { thinkingBudget: 1 },
      },
    }),
    // A stalled connection would otherwise park this request (and everything
    // behind it — the daemon's POST, the agent's tool call) indefinitely.
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini API returned ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }

  const body = await res.json();
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    throw new Error('Gemini API response missing candidate text');
  }
  return text;
}
