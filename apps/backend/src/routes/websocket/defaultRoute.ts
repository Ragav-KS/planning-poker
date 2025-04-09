import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { USERS_TABLE } from '../../constants';
import { factory } from '../../hono-factory';
import { docClient } from '../../services/aws-sdk/ddbClient';

export const webSocketDefaultRoute = factory.createApp();

webSocketDefaultRoute.post(
  '/vote',
  zValidator(
    'json',
    z.object({
      value: z.number(),
    }),
  ),
  async (c) => {
    const userId = c.env.requestContext.authorizer.principalId;

    const voteValue = c.req.valid('json').value;

    const command = new UpdateCommand({
      TableName: USERS_TABLE,
      Key: {
        userId,
      },
      UpdateExpression: 'set vote = :vote',
      ExpressionAttributeValues: {
        ':vote': voteValue,
      },
    });

    await docClient.send(command);

    return c.body(null, 202);
  },
);
