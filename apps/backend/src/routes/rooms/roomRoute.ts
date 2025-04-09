import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { zValidator } from '@hono/zod-validator';
import { randomUUID } from 'crypto';
import { sign } from 'hono/jwt';
import { z } from 'zod';
import { USERS_TABLE } from '../../constants';
import { factory } from '../../hono-factory';
import { docClient } from '../../services/aws-sdk/ddbClient';

export const roomRoute = factory.createApp();

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
      TableName: USERS_TABLE,
      Item: {
        userId,
        name: userName,
        roomId: roomId,
        vote: 0,
      },
      ConditionExpression: 'attribute_not_exists(userId)',
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

    const command = new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        userId,
        name: userName,
        roomId: roomId,
        vote: 0,
      },
      ConditionExpression: 'attribute_not_exists(userId)',
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
