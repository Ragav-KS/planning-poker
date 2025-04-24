import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { handler as authorizerHandler } from '@planning-poker/authorizer';
import type {
  APIGatewayRequestAuthorizerEvent,
  Context as AWSContext,
} from 'aws-lambda';
import { randomUUID } from 'crypto';
import { Hono, type Context, type Env } from 'hono';
import xior from 'xior';

type SocketCallback = (data: string) => Promise<void> | void;

const connections = new Map<string, SocketCallback>();

interface CustomWSEnv extends Env {
  Variables: {
    principalId: string;
  };
}

const localApp = new Hono<{
  Variables: {
    principalId: string;
  };
}>();

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
  '/',
  async (c, next) => {
    const headers: Record<string, string | undefined> = {
      Authorization: c.req.header('Authorization'),
    };

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const authorizerResult = await authorizerHandler(
      {
        headers,
        methodArn: 'arn:localMethod',
      } as APIGatewayRequestAuthorizerEvent,
      {} as AWSContext,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
    )!;

    if (authorizerResult.policyDocument.Statement[0].Effect === 'Deny') {
      return c.json('Unauthorized', 401);
    }

    c.set('principalId', authorizerResult.principalId);

    await next();
  },
  upgradeWebSocket((c: Context<CustomWSEnv>) => {
    const principalId = c.get('principalId');

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
              principalId,
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
              principalId,
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
            principalId,
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
