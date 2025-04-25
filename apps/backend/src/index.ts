import { handle } from 'hono/aws-lambda';
import { HTTPException } from 'hono/http-exception';
import { factory } from './hono-factory';
import { apiRoute } from './routes/apiRoute';
import { websocketRoute } from './routes/websocketRoute';

export const app = factory.createApp();

app.notFound((c) => {
  return c.json(
    {
      message: 'Not found',
    },
    404,
  );
});

app.onError(async (err, c) => {
  console.error(err);

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json(
    {
      message: 'Internal Server Error',
    },
    500,
  );
});

app.route('/api', apiRoute);

app.route('/websocket', websocketRoute);

export const handler = handle(app);
