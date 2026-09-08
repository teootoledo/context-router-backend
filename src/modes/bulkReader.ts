import express from 'express';
import type { LoggerService } from '@backstage/backend-plugin-api';
import { BulkReadRequestSchema, type BulkReadResponse } from '@context-router/contract';
import { callGemini } from '../geminiClient.ts';

const BULK_READER_SYSTEM_PROMPT =
  "You are a precise code analyst. Read the provided files (enclosed in XML tags) and answer the user's query concisely. Output structured bullet points only. Do not use greetings, prose, or preambles. Lead every bullet with the exact file name, method type, or line number. Use nested bullets for details. Skip any information the caller did not explicitly ask for.";

function wrapFilesInXml(files: { path: string; content: string }[]): string {
  return files.map((f) => `<file path="${f.path}">\n${f.content}\n</file>`).join('\n');
}

export function createBulkReaderRouter(opts: {
  apiKey: string;
  logger: LoggerService;
}): express.Router {
  const router = express.Router();

  router.post('/modes/bulk-reader', async (req, res) => {
    const parsed = BulkReadRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const userContent = `${wrapFilesInXml(parsed.data.files)}\n\nQuery: ${parsed.data.query}`;
    try {
      const summary = await callGemini({
        apiKey: opts.apiKey,
        systemPrompt: BULK_READER_SYSTEM_PROMPT,
        userContent,
      });

      const body: BulkReadResponse = { summary };
      res.status(200).json(body);
    } catch (error) {
      // Express 4 does not catch rejections from an async handler: without this,
      // a Gemini failure leaves the daemon with no response at all and can take
      // the process down. The log line is also the hook a host company wires its
      // own alerting onto (spec section 4).
      opts.logger.error('bulk-reader worker model call failed', error as Error);
      res.status(502).json({ error: 'worker model call failed' });
    }
  });

  return router;
}
