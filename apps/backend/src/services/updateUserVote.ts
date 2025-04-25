import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { UUID } from 'crypto';
import { POKER_TABLE } from '../constants';
import { docClient } from './aws-sdk/ddbClient';

export async function updateUserVote(userId: UUID, voteValue: number) {
  const updateCommand = new UpdateCommand({
    TableName: POKER_TABLE,
    Key: {
      pk: `USER#${userId}`,
    },
    UpdateExpression: 'set vote = :vote',
    ConditionExpression: 'attribute_exists(pk)',
    ExpressionAttributeValues: {
      ':vote': voteValue,
    },
    ReturnValues: 'ALL_NEW',
  });

  const result = await docClient.send(updateCommand);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const roomId = result.Attributes!.roomId as UUID;

  return roomId;
}
