import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { POKER_TABLE } from '../constants';
import { docClient } from './aws-sdk/ddbClient';

export async function removeUserConnectionId(
  userId: string,
) {
  const updateConnectionIdCommand = new UpdateCommand({
    TableName: POKER_TABLE,
    Key: {
      pk: `USER#${userId}`,
    },
    UpdateExpression: 'REMOVE connectionId',
    ConditionExpression: 'attribute_exists(pk)',
  });

  await docClient.send(updateConnectionIdCommand);
}
