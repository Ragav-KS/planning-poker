import {
  GoneException,
  type PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import xior from 'xior';

export class WebSocketLocalApiClient {
  async send(command: PostToConnectionCommand) {
    const connectionId = command.input.ConnectionId;
    if (!connectionId) throw new Error('ConnectionId is required');

    const data = command.input.Data;

    const res = await xior.post(
      `http://127.0.0.1:3500/@connections/${connectionId}`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (res.status === 401)
      throw new GoneException({
        message: '401 - Connection not found',
        $metadata: {},
      });
  }
}

export const localApiClient = new WebSocketLocalApiClient();
