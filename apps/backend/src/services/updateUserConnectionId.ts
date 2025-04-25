import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { HTTPException } from 'hono/http-exception';
import { POKER_TABLE } from '../constants';
import { docClient } from './aws-sdk/ddbClient';

export async function updateUserConnectionId(
  userId: string,
  connectionId: string | undefined,
) {
  const now = new Date();

  const updateConnectionIdCommand = new UpdateCommand({
    TableName: POKER_TABLE,
    Key: {
      pk: `USER#${userId}`,
    },
    UpdateExpression: 'set connectionId = :connectionId',
    ConditionExpression: 'attribute_exists(pk) AND expiresAt > :now',
    ExpressionAttributeValues: {
      ':connectionId': connectionId,
      ':now': Math.floor(now.getTime() / 1000),
    },
  });

  try {
    await docClient.send(updateConnectionIdCommand);
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      throw new HTTPException(401, { message: 'User not found or expired' });
    }
  }
}
