import { Hono } from 'hono';

export const webSocketDefaultRoute = new Hono();

webSocketDefaultRoute.post('/vote', async (c) => {
  return c.json({
    message: 'test',
  });
});
