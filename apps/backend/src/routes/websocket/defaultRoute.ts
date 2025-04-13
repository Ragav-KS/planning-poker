import {
  ApiGatewayManagementApiClient,
  GoneException,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { USERS_TABLE } from '../../constants';
import { factory } from '../../hono-factory';
import { docClient } from '../../services/aws-sdk/ddbClient';
import { localApiClient } from '../../utils/localrun/localApiClient';

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
    const userId = c.get('authorizer').principalId;

    const voteValue = c.req.valid('json').value;

    const updateCommand = new UpdateCommand({
      TableName: USERS_TABLE,
      Key: {
        userId,
      },
      UpdateExpression: 'set vote = :vote',
      ExpressionAttributeValues: {
        ':vote': voteValue,
      },
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(updateCommand);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const roomId = result.Attributes!.roomId;

    const scanCommand = new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'roomId = :roomId AND NOT (userId = :userId)',
      ExpressionAttributeValues: {
        ':roomId': roomId,
        ':userId': userId,
      },
      ConsistentRead: true,
    });

    const scanCommandResult = await docClient.send(scanCommand);

    const scanItems = scanCommandResult.Items || [];

    const apiClient = !import.meta.env.VITE_IS_LOCAL_RUN
      ? new ApiGatewayManagementApiClient({
          endpoint: `https://${c.env.requestContext.apiId}.execute-api.ap-south-1.amazonaws.com/prod`,
        })
      : localApiClient;

    await Promise.all(
      scanItems.map(async (item) => {
        const connectionId = item.connectionId;

        const postCommand = new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({
            userId,
            voteValue,
          }),
        });

        try {
          await (
            !import.meta.env.VITE_IS_LOCAL_RUN ? apiClient : localApiClient
          ).send(postCommand);
        } catch (error) {
          if (error instanceof GoneException) {
            console.warn(
              `User ${item.name} (${item.connectionId}) is not connected`,
            );

            return;
          }

          throw error;
        }
      }),
    );

    return c.body(null, 202);
  },
);
