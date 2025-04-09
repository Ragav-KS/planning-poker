import { factory } from '../hono-factory';
import { webSocketDefaultRoute } from './websocket/defaultRoute';

export const websocketRoute = factory.createApp();

websocketRoute
  .post('/connect', async (c) => {
    console.log('Connect route called');
    return c.text('connected');
  })
  .delete('/connect', async (c) => {
    console.log('Disconnect route called');
    return c.text('disconnected');
  });

websocketRoute.route('/default', webSocketDefaultRoute);
