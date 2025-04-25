import { TransactionCanceledException } from '@aws-sdk/client-dynamodb';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { HTTPException } from 'hono/http-exception';
import { POKER_TABLE } from '../constants';
import { docClient } from './aws-sdk/ddbClient';

export async function createRoomAndUser(userName: string) {
  const roomId = randomUUID();
  const userId = randomUUID();

  const now = new Date();

  const roomExpiresAt = new Date(now);
  roomExpiresAt.setHours(roomExpiresAt.getHours() + 12);

  const userExpiresAt = new Date(now);
  userExpiresAt.setMinutes(userExpiresAt.getMinutes() + 15);

  const createRoomAndUserCommand = new TransactWriteCommand({
    TransactItems: [
      {
        Put: {
          TableName: POKER_TABLE,
          Item: {
            pk: `ROOM#${roomId}`,
            expiresAt: Math.floor(roomExpiresAt.getTime() / 1000),
          },
          ConditionExpression: 'attribute_not_exists(pk)',
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
    await docClient.send(createRoomAndUserCommand);
  } catch (error) {
    if (error instanceof TransactionCanceledException) {
      if (
        error.CancellationReasons?.some(
          (reason) => reason.Code === 'ConditionalCheckFailed',
        )
      ) {
        throw new HTTPException(503, {
          message: 'Server overloaded. Please try again.',
        });
      }
    }
  }

  return { userId, roomId, userExpiresAt };
}
