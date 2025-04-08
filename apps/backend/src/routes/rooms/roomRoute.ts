import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { zValidator } from '@hono/zod-validator';
import { randomUUID } from 'crypto';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { z } from 'zod';

export const roomRoute = new Hono();

roomRoute.post(
  '/create',
  zValidator(
    'json',
    z.object({
      userName: z.string().regex(/^[\w ]+$/),
    }),
  ),
  async (c) => {
    const userName = c.req.valid('json').userName;

    const client = new DynamoDBClient();
    const docClient = DynamoDBDocumentClient.from(client);

    const roomId = randomUUID();
    const userId = randomUUID();

    const command = new PutCommand({
      TableName: 'rooms',
      Item: {
        roomId: roomId,
        members: [
          {
            userId: userId,
            userName: userName,
            vote: 0,
          },
        ],
      },
    });

    await docClient.send(command);

    const token = await sign(
      {
        userId: userId,
        roomId: roomId,
      },
      process.env.APP_JWT_SECRET_KEY,
    );

    return c.json({
      accessToken: token,
    });
  },
);
