import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { apiRoute } from './routes/apiRoute';
import { websocketRoute } from './routes/websocketRoute';

export const app = new Hono();

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
