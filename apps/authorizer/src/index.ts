import type {
  APIGatewayRequestAuthorizerEventHeaders,
  APIGatewayRequestAuthorizerHandler,
  AuthResponse,
} from 'aws-lambda';
import { jwtVerify } from 'jose';

export const handler: APIGatewayRequestAuthorizerHandler = async (
  event,
  context,
) => {
  console.log('event', event);

  console.log('context', context);

  try {
    const eventheaders =
      event.headers as APIGatewayRequestAuthorizerEventHeaders;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const authHeader = eventheaders['Authorization']!;

    const regexResult = /^Bearer (?<token>.*)$/.exec(authHeader);

    const token = regexResult?.groups?.token;

    if (!token) {
      throw new Error('Invalid Authorization header');
    }

    const secret = new TextEncoder().encode(process.env.APP_JWT_SECRET_KEY);
    const jwtResult = await jwtVerify(token, secret);

    const subject = jwtResult.payload.sub;

    if (!subject) {
      throw new Error('Invalid Access token');
    }

    return allowPolicy(event.methodArn, subject);
  } catch {
    return denyAllPolicy();
  }
};

function denyAllPolicy(): AuthResponse {
  return {
    principalId: '*',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: '*',
          Effect: 'Deny',
          Resource: '*',
        },
      ],
    },
  };
}

function allowPolicy(methodArn: string, userId: string): AuthResponse {
  return {
    principalId: userId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: methodArn,
        },
      ],
    },
  };
}
