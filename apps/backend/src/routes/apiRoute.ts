import { factory } from '../hono-factory';
import { roomRoute } from './rooms/roomRoute';

export const apiRoute = factory.createApp();

apiRoute.route('/rooms', roomRoute);
