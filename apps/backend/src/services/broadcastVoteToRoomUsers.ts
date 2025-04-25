import {
  ApiGatewayManagementApiClient,
  GoneException,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { localApiClient } from '../utils/localrun/localApiClient';

export async function broadcastVoteToRoomUsers(
  apiId: string,
  userId: string,
  voteValue: number,
  roomUsers: { name: string; connectionId: string }[],
) {
  const apiClient = !import.meta.env.VITE_IS_LOCAL_RUN
    ? new ApiGatewayManagementApiClient({
        endpoint: `https://${apiId}.execute-api.ap-south-1.amazonaws.com/prod`,
      })
    : localApiClient;

  await Promise.all(
    roomUsers.map(async (item) => {
      const postCommand = new PostToConnectionCommand({
        ConnectionId: item.connectionId,
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
}
