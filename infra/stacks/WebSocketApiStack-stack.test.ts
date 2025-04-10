import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { beforeAll, describe, expect, test } from 'vitest';
import { loadAndVerifyEnv } from '../utils/loadEnv';
import { AuthorizerLambdaStack } from './AuthorizerLambda-stack';
import { BackendLambdaStack } from './BackendLambda-stack';
import { DatabaseStack } from './Database-stack';
import { WebSocketApiStack } from './WebSocketApiStack-stack';

describe('Sample test for Infra Stack', () => {
  let template: Template;

  beforeAll(() => {
    const env = loadAndVerifyEnv(['.env']);

    const app = new App();

    const databaseStack = new DatabaseStack(app, 'Poker-DatabaseStack', {
      env: {
        region: env.CDK_DEFAULT_REGION,
        account: env.CDK_DEFAULT_ACCOUNT,
      },
    });

    const backendLambdaStack = new BackendLambdaStack(
      app,
      'Poker-BackendLambdaStack',
      {
        env: {
          region: env.CDK_DEFAULT_REGION,
          account: env.CDK_DEFAULT_ACCOUNT,
        },
        tables: {
          usersTable: databaseStack.usersTable,
        },
        appJwtSecretKey: env.APP_JWT_SECRET_KEY,
      },
    );
    backendLambdaStack.addDependency(databaseStack);

    const authorizerLambdaStack = new AuthorizerLambdaStack(
      app,
      'Poker-AuthorizerLambdaStack',
      {
        env: {
          account: env.CDK_DEFAULT_REGION,
          region: env.CDK_DEFAULT_ACCOUNT,
        },
        appJwtSecretKey: env.APP_JWT_SECRET_KEY,
      },
    );

    const websocketApiStack = new WebSocketApiStack(
      app,
      'Poker-WebSocketApiStack',
      {
        env: {
          region: env.CDK_DEFAULT_REGION,
          account: env.CDK_DEFAULT_ACCOUNT,
        },
        webSocketDomainName: env.APP_WEBSOCKET_DOMAIN,
        webSocketDomainCertificate: env.APP_WEBSOCKET_DOMAIN,
        backendFnExecutionRoleArn:
          backendLambdaStack.lambdaExecutionRole.roleArn,
        backendFnAliasArn: backendLambdaStack.lambdaFnAlias.functionArn,
        authorizerFnAliasArn:
          authorizerLambdaStack.authorizerFnAlias.functionArn,
      },
    );
    websocketApiStack.addDependency(backendLambdaStack);

    template = Template.fromStack(websocketApiStack);
  });

  test('sample test', () => {
    expect(template).toBeDefined();
  });
});
