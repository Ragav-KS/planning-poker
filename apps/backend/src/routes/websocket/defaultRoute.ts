import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { Hono } from 'hono';

export const webSocketDefaultRoute = new Hono();

webSocketDefaultRoute.post('/create-room', async (c) => {
  const client = new DynamoDBClient();
  const docClient = DynamoDBDocumentClient.from(client);

  const roomId = randomUUID();

  const command = new PutCommand({
    TableName: 'rooms',
    Item: {
      roomId: roomId,
      members: [
        {
          userId: 'test',
          type: 'owner',
        },
      ],
    },
  });

  await docClient.send(command);

  return c.json({
    roomId,
  });
});
