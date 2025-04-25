import { TransactionCanceledException } from '@aws-sdk/client-dynamodb';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID, type UUID } from 'crypto';
import { HTTPException } from 'hono/http-exception';
import { POKER_TABLE } from '../constants';
import { docClient } from './aws-sdk/ddbClient';

export async function createUser(userName: string, roomId: UUID) {
  const userId = randomUUID();

  const now = new Date();

  const userExpiresAt = new Date(now);
  userExpiresAt.setMinutes(userExpiresAt.getMinutes() + 15);

  const addUserCommand = new TransactWriteCommand({
    TransactItems: [
      {
        ConditionCheck: {
          TableName: POKER_TABLE,
          Key: {
            pk: `ROOM#${roomId}`,
          },
          ConditionExpression: 'expiresAt > :now',
          ExpressionAttributeValues: {
            ':now': Math.floor(now.getTime() / 1000),
          },
        },
      },
      {
        Put: {
          TableName: POKER_TABLE,
          Item: {
            pk: `USER#${userId}`,
            roomId: roomId,
            name: userName,
            vote: 0,
            expiresAt: Math.floor(userExpiresAt.getTime() / 1000),
          },
          ConditionExpression: 'attribute_not_exists(pk)',
        },
      },
    ],
  });

  try {
    await docClient.send(addUserCommand);
  } catch (error) {
    if (error instanceof TransactionCanceledException) {
      if (error.CancellationReasons?.[0].Code === 'ConditionalCheckFailed') {
        throw new HTTPException(400, {
          message: 'Room not found or expired',
        });
      }

      if (error.CancellationReasons?.[1].Code === 'ConditionalCheckFailed') {
        throw new HTTPException(503, {
          message: 'Server overloaded. Please try again.',
        });
      }
    }
  }

  return {userId, userExpiresAt};
}
