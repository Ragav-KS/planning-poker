import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { beforeAll, describe, expect, test } from 'vitest';
import { loadAndVerifyEnv } from '../utils/loadEnv';
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
          roomsTable: databaseStack.roomsTable,
        },
      },
    );
    backendLambdaStack.addDependency(databaseStack);

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
        lambdaFnAliasArn: backendLambdaStack.lambdaFnAlias.functionArn,
      },
    );
    websocketApiStack.addDependency(backendLambdaStack);

    template = Template.fromStack(websocketApiStack);
  });

  test('sample test', () => {
    expect(template).toBeDefined();
  });
});
