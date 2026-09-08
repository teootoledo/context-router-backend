import { createBackendPlugin, coreServices } from '@backstage/backend-plugin-api';
import express from 'express';

export const contextRouterPlugin = createBackendPlugin({
  pluginId: 'context-router',
  register(reg) {
    reg.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
      },
      async init({ httpRouter, logger }) {
        const router = express.Router();
        router.use(express.json());
        router.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
        httpRouter.use(router);
        logger.info('context-router backend plugin initialized');
      },
    });
  },
});
