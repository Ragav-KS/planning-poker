import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { zValidator } from '@hono/zod-validator';
import { randomUUID } from 'crypto';
import { sign } from 'hono/jwt';
import { z } from 'zod';
import { factory } from '../../hono-factory';

export const roomRoute = factory.createApp();

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

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
        sub: userId,
      },
      process.env.APP_JWT_SECRET_KEY,
    );

    return c.json({
      accessToken: token,
      roomId: roomId,
    });
  },
);

roomRoute.post(
  '/join',
  zValidator(
    'json',
    z.object({
      userName: z.string().regex(/^[\w ]+$/),
      roomId: z.string().uuid(),
    }),
  ),
  async (c) => {
    const userName = c.req.valid('json').userName;
    const roomId = c.req.valid('json').roomId;
    const userId = randomUUID();
    const members = {
      userId: userId,
      userName: userName,
      vote: 0,
    };

    const command = new UpdateCommand({
      TableName: 'rooms',
      Key: {
        roomId: roomId,
      },
      UpdateExpression: 'SET members = list_append(members, :new_member)',
      ExpressionAttributeValues: {
        ':new_member': [members],
      },
    });
    await docClient.send(command);

    const token = await sign(
      {
        sub: userId,
      },
      process.env.APP_JWT_SECRET_KEY,
    );

    return c.json({
      accessToken: token,
    });
  },
);
