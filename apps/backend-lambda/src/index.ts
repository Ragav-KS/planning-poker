import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';

const app = new Hono();

const webSocketDefaultRoute = new Hono();

webSocketDefaultRoute.post('/:path', async (c) => {
  return c.json({
    route: '$default',
    path: c.req.param('path'),
  });
});

app.route('/websocket/default', webSocketDefaultRoute);

export const handler = handle(app);
