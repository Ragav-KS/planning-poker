import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';

const webSocketDefaultRoute = new Hono();

webSocketDefaultRoute.post('/create-room', async (c) => {
  return c.json({
    message: 'Room created',
  });
});

const websocketRoute = new Hono();

websocketRoute
  .get('/connect', async (c) => {
    console.log('Connect route called');
    return c.status(200);
  })
  .delete('/connect', async (c) => {
    console.log('Disconnect route called');
    return c.status(200);
  });

websocketRoute.route('/default', webSocketDefaultRoute);

export const app = new Hono();

app.route('/websocket', websocketRoute);

export const handler = handle(app);
