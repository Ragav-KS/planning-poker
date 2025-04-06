import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { websocketRoute } from './routes/websocketRoute';

export const app = new Hono();

app.route('/websocket', websocketRoute);

export const handler = handle(app);
