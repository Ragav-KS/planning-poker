import { Hono } from 'hono';
import { webSocketDefaultRoute } from './websocket/defaultRoute';

export const websocketRoute = new Hono();

websocketRoute
  .get('/connect', async (c) => {
    console.log('Connect route called');
    return c.text('connected');
  })
  .delete('/connect', async (c) => {
    console.log('Disconnect route called');
    return c.text('disconnected');
  });

websocketRoute.route('/default', webSocketDefaultRoute);
