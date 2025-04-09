import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { USERS_TABLE } from '../constants';
import { factory } from '../hono-factory';
import { docClient } from '../services/aws-sdk/ddbClient';
import { webSocketDefaultRoute } from './websocket/defaultRoute';

export const websocketRoute = factory.createApp();

websocketRoute
  .post('/connect', async (c) => {
    const userId = c.env.requestContext.authorizer.principalId;

    const connectionId = c.req.header('X-WebSocket-Connection-Id');

    const command = new UpdateCommand({
      TableName: USERS_TABLE,
      Key: {
        userId,
      },
      UpdateExpression: 'set connectionId = :connectionId',
      ExpressionAttributeValues: {
        ':connectionId': connectionId,
      },
    });

    await docClient.send(command);

    return c.body(null, 202);
  })
  .delete('/connect', async (c) => {
    console.log('Disconnect route called');
    return c.text('disconnected');
  });

websocketRoute.route('/default', webSocketDefaultRoute);
