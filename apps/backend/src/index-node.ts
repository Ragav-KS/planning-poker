import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import type { JWTPayload } from 'hono/utils/jwt/types';
import { app } from '.';
import type { CustomApiGatewayRequestContext } from './hono-factory';

const localApp = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({
  app: localApp,
});

localApp.route('/', app);

localApp.get(
  '/',
  jwt({ secret: process.env.APP_JWT_SECRET_KEY }),
  upgradeWebSocket((c) => {
    const authPayload = c.get('jwtPayload') as JWTPayload;

    const customRequestContext: Partial<CustomApiGatewayRequestContext> = {
      authorizer: {
        principalId: authPayload.sub as string,
      },
    };

    return {
      async onOpen() {
        await app.request(
          `/websocket/connect`,
          {
            method: 'POST',
          },
          {
            requestContext: customRequestContext,
          },
        );

        console.log('Connection opened');
      },
      async onMessage(msg, ws) {
        const messageJson = JSON.parse(msg.data.toString());

        const action = messageJson['action'];
        const data = messageJson['data'];

        const res = await app.request(
          `/websocket/default/${action}`,
          {
            method: 'POST',
            body: JSON.stringify(data),
          },
          {
            requestContext: customRequestContext,
          },
        );

        const responseBody = await res.json();

        ws.send(JSON.stringify(responseBody));
      },
      async onClose() {
        await app.request(
          `/websocket/connect`,
          {
            method: 'DELETE',
          },
          {
            requestContext: customRequestContext,
          },
        );

        console.log('Connection closed');
      },
    };
  }),
);

export const server = serve(
  {
    fetch: localApp.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

injectWebSocket(server);
