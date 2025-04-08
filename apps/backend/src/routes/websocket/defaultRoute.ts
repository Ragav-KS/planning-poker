import { Hono } from 'hono';

export const webSocketDefaultRoute = new Hono();

webSocketDefaultRoute.post('/vote', async (c) => {
  const body = await c.req.json();

  console.log(body);

  return c.json({
    message: 'test',
  });
});
