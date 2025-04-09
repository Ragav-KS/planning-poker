import type { Env } from 'hono';
import type {
  ApiGatewayRequestContext,
  LambdaContext,
  LambdaEvent,
} from 'hono/aws-lambda';
import { Factory } from 'hono/factory';
import type { Bindings, Variables } from 'hono/types';

interface AWSBindings extends Bindings {
  event: LambdaEvent;
  lambdaContext: LambdaContext;
  requestContext: ApiGatewayRequestContext;
}

interface AWSHonoEnv extends Env {
  Bindings: AWSBindings;
  Variables: Variables;
}

export const factory = new Factory<AWSHonoEnv>();
