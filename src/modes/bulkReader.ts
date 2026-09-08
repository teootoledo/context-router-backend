import express from 'express';
import { BulkReadRequestSchema, type BulkReadResponse } from '@context-router/contract';
import { callGemini } from '../geminiClient.ts';

const BULK_READER_SYSTEM_PROMPT =
  "You are a precise code analyst. Read the provided files (enclosed in XML tags) and answer the user's query concisely. Output structured bullet points only. Do not use greetings, prose, or preambles. Lead every bullet with the exact file name, method type, or line number. Use nested bullets for details. Skip any information the caller did not explicitly ask for.";

function wrapFilesInXml(files: { path: string; content: string }[]): string {
  return files.map((f) => `<file path="${f.path}">\n${f.content}\n</file>`).join('\n');
}

export function createBulkReaderRouter(opts: { apiKey: string }): express.Router {
  const router = express.Router();

  router.post('/modes/bulk-reader', async (req, res) => {
    const parsed = BulkReadRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const userContent = `${wrapFilesInXml(parsed.data.files)}\n\nQuery: ${parsed.data.query}`;
    const summary = await callGemini({
      apiKey: opts.apiKey,
      systemPrompt: BULK_READER_SYSTEM_PROMPT,
      userContent,
    });

    const body: BulkReadResponse = { summary };
    res.status(200).json(body);
  });

  return router;
}
