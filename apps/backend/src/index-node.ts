import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { Hono } from 'hono';
import { app } from '.';

const localApp = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({
  app: localApp,
});

localApp.get(
  '/',
  upgradeWebSocket(() => {
    return {
      async onOpen() {
        await app.request(`/websocket/connect`, {
          method: 'GET',
        });

        console.log('Connection opened');
      },
      async onMessage(msg, ws) {
        const messageJson = JSON.parse(msg.data.toString());

        const res = await app.request(
          `/websocket/default/${messageJson['action']}`,
          {
            method: 'POST',
            body: JSON.stringify(messageJson['data']),
          },
        );

        const responseBody = await res.json();

        ws.send(JSON.stringify(responseBody));
      },
      async onClose() {
        await app.request(`/websocket/connect`, {
          method: 'DELETE',
        });

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
