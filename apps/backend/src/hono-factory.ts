import type { UUID } from 'crypto';
import type { Env } from 'hono';
import type {
  ApiGatewayRequestContext,
  LambdaContext,
  LambdaEvent,
} from 'hono/aws-lambda';
import { Factory } from 'hono/factory';
import type { Bindings, Variables } from 'hono/types';

export interface CustomApiGatewayRequestContext
  extends Omit<ApiGatewayRequestContext, 'authorizer'> {
  authorizer: {
    principalId: UUID;
  };
}

interface AWSBindings extends Bindings {
  event: LambdaEvent;
  lambdaContext: LambdaContext;
  requestContext: CustomApiGatewayRequestContext;
}

interface CustomVariables extends Variables {
  authorizer: {
    principalId: UUID;
  };
}

interface AWSHonoEnv extends Env {
  Bindings: AWSBindings;
  Variables: CustomVariables;
}

export const factory = new Factory<AWSHonoEnv>();
