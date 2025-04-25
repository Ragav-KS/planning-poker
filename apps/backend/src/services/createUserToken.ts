import { sign } from 'hono/jwt';

export async function createUserToken(userId: string, expiresAt: number) {
  return await sign(
    {
      sub: userId,
      exp: expiresAt,
    },
    process.env.APP_JWT_SECRET_KEY,
  );
}
