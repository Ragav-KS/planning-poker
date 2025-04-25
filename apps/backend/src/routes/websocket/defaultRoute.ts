import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { factory } from '../../hono-factory';
import { broadcastVoteToRoomUsers } from '../../services/broadcastVoteToRoomUsers';
import { getRoomUserConnectionIds } from '../../services/getRoomUserConnectionIds';
import { updateUserVote } from '../../services/updateUserVote';

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
    const apiId = !import.meta.env.VITE_IS_LOCAL_RUN
      ? c.env.requestContext.apiId
      : 'localApiId';

    const userId = c.get('authorizer').principalId;
    const voteValue = c.req.valid('json').value;

    const roomId = await updateUserVote(userId, voteValue);

    const roomUsers = await getRoomUserConnectionIds(roomId, userId);

    await broadcastVoteToRoomUsers(apiId, userId, voteValue, roomUsers);

    return c.body(null, 204);
  },
);
