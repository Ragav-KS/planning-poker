import { zValidator } from '@hono/zod-validator';
import type { UUID } from 'crypto';
import { z } from 'zod';
import { factory } from '../../hono-factory';
import { createRoomAndUser } from '../../services/createRoomAndUser';
import { createUser } from '../../services/createUser';
import { createUserToken } from '../../services/createUserToken';

export const roomRoute = factory.createApp();

roomRoute.post(
  '/create',
  zValidator(
    'json',
    z.object({
      userName: z.string().regex(/^[\w ]+$/),
    }),
  ),
  async (c) => {
    const userName = c.req.valid('json').userName;

    const { userId, roomId, userExpiresAt } = await createRoomAndUser(userName);

    const token = await createUserToken(userId, userExpiresAt.getTime());

    return c.json({
      accessToken: token,
      roomId: roomId,
    });
  },
);

roomRoute.post(
  '/join',
  zValidator(
    'json',
    z.object({
      userName: z.string().regex(/^[\w ]+$/),
      roomId: z.string().uuid(),
    }),
  ),
  async (c) => {
    const userName = c.req.valid('json').userName;
    const roomId = c.req.valid('json').roomId as UUID;

    const { userId, userExpiresAt } = await createUser(userName, roomId);

    const token = await createUserToken(userId, userExpiresAt.getTime());

    return c.json({
      accessToken: token,
    });
  },
);
