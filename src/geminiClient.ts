const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function callGemini(opts: {
  apiKey: string;
  systemPrompt: string;
  userContent: string;
}): Promise<string> {
  const url = `${GEMINI_ENDPOINT}?key=${opts.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.systemPrompt }] },
      contents: [{ parts: [{ text: opts.userContent }] }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API returned ${res.status}`);
  }

  const body = await res.json();
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    throw new Error('Gemini API response missing candidate text');
  }
  return text;
}
