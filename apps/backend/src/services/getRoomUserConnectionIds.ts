import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { UUID } from 'crypto';
import { z } from 'zod';
import { POKER_TABLE } from '../constants';
import { docClient } from './aws-sdk/ddbClient';

export async function getRoomUserConnectionIds(roomId: UUID, excludeUserId: UUID) {
  const userConnectionIdsQueryCommand = new QueryCommand({
    TableName: POKER_TABLE,
    IndexName: 'rooms',
    KeyConditionExpression: 'roomId = :roomId',
    FilterExpression: 'NOT (pk = :userId)',
    ExpressionAttributeValues: {
      ':roomId': roomId,
      ':userId': `USER#${excludeUserId}`,
    },
    ExpressionAttributeNames: {
      '#name': 'name',
    },
    ProjectionExpression: '#name, connectionId',
  });

  const scanCommandResult = await docClient.send(userConnectionIdsQueryCommand);

  const scanItems = scanCommandResult.Items || [];

  return z
    .array(z.object({ name: z.string(), connectionId: z.string() }))
    .parse(scanItems);
}
