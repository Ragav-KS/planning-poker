import { factory } from '../../hono-factory';

export const webSocketDefaultRoute = factory.createApp();

webSocketDefaultRoute.post('/vote', async (c) => {
  const body = await c.req.json();

  console.log(body);

  return c.json({
    message: 'test',
  });
});
