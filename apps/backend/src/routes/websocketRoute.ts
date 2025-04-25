import type { UUID } from 'crypto';
import { factory } from '../hono-factory';
import { removeUserConnectionId } from '../services/removeUserConnectionId';
import { updateUserConnectionId } from '../services/updateUserConnectionId';
import { webSocketDefaultRoute } from './websocket/defaultRoute';

export const websocketRoute = factory.createApp();

websocketRoute.use(async (c, next) => {
  if (!import.meta.env.VITE_IS_LOCAL_RUN) {
    c.set('authorizer', c.env.requestContext.authorizer);
  } else {
    const principalId = c.req.header('principalId');

    if (!principalId) throw new Error('Principal ID header missing');

    c.set('authorizer', { principalId: principalId as UUID });
  }

  await next();
});

websocketRoute
  .post('/connect', async (c) => {
    const userId = c.get('authorizer').principalId;
    const connectionId = c.req.header('X-WebSocket-Connection-Id');

    await updateUserConnectionId(userId, connectionId);

    return c.body(null, 204);
  })
  .delete('/connect', async (c) => {
    const userId = c.get('authorizer').principalId;

    await removeUserConnectionId(userId);

    return c.body(null, 204);
  });

websocketRoute.route('/default', webSocketDefaultRoute);
