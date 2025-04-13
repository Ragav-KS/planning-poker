import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { randomUUID } from 'crypto';
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import type { JWTPayload } from 'hono/utils/jwt/types';
import xior from 'xior';

type SocketCallback = (data: string) => Promise<void> | void;

const connections = new Map<string, SocketCallback>();

const localApp = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({
  app: localApp,
});

const pokerFnXior = xior.create({
  baseURL: 'http://127.0.0.1:3000/',
});

localApp.post('/@connections/:path', async (c) => {
  const connectionId = c.req.param('path');

  const reqBody = await c.req.json();

  const data = JSON.stringify(reqBody);

  const callback = connections.get(connectionId);

  if (!callback) return c.json('Connection not found', 401);

  await callback(data);

  return c.json('message sent');
});

localApp.get(
  '/socket',
  jwt({ secret: process.env.APP_JWT_SECRET_KEY }),
  upgradeWebSocket((c) => {
    const authPayload = c.get('jwtPayload') as JWTPayload;

    const connectionId = randomUUID();

    return {
      onError(evt) {
        console.log(evt);
      },
      async onOpen(_, ws) {
        await pokerFnXior.post(
          `/websocket/connect`,
          {},
          {
            headers: {
              'X-WebSocket-Connection-Id': connectionId,
              principalId: authPayload.sub,
            },
          },
        );

        connections.set(connectionId, (data) => {
          ws.send(data);
        });

        console.log('Connection opened');
      },
      async onMessage(msg, ws) {
        const messageJson = JSON.parse(msg.data.toString());

        const action = messageJson['action'];

        const res = await pokerFnXior.post(
          `/websocket/default/${action}`,
          messageJson['data'],
          {
            headers: {
              'X-WebSocket-Connection-Id': connectionId,
              principalId: authPayload.sub,
            },
          },
        );

        if (res.status === 200) {
          const responseBody = await res.data;

          ws.send(JSON.stringify(responseBody));
        }
      },
      async onClose() {
        await pokerFnXior.delete(`/websocket/connect`, {
          headers: {
            'X-WebSocket-Connection-Id': connectionId,
            principalId: authPayload.sub,
          },
        });

        console.log('Connection closed');
      },
    };
  }),
);

export const server = serve(
  {
    fetch: localApp.fetch,
    port: 3500,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

injectWebSocket(server);
