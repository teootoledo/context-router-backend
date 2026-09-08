import { createBackendPlugin, coreServices } from '@backstage/backend-plugin-api';
import express from 'express';
import { createBulkReaderRouter } from './modes/bulkReader.ts';

export const contextRouterPlugin = createBackendPlugin({
  pluginId: 'context-router',
  register(reg) {
    reg.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
      },
      async init({ httpRouter, logger }) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('context-router: GEMINI_API_KEY is not set');
        }

        const router = express.Router();
        router.use(express.json({ limit: '25mb' }));
        router.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
        router.use(createBulkReaderRouter({ apiKey, logger }));

        // This endpoint is deliberately open for this slice — auth is a later plan.
        // Without this, Backstage's default credentials barrier 401s every request,
        // since only startTestBackend's MockHttpAuthService authenticates for free.
        httpRouter.addAuthPolicy({ path: '/', allow: 'unauthenticated' });
        httpRouter.use(router);
        logger.info('context-router backend plugin initialized');
      },
    });
  },
});
