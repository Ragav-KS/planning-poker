import { Hono } from 'hono';
import { roomRoute } from './rooms/roomRoute';

export const apiRoute = new Hono();

apiRoute.route('/rooms', roomRoute);
