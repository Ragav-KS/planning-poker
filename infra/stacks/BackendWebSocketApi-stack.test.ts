import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { beforeAll, describe, expect, test } from 'vitest';
import { loadAndVerifyEnv } from '../utils/loadEnv';
import { BackendWebSocketApiStack } from './BackendWebSocketApi-stack';
import { DatabaseStack } from './DataBase-stack';

describe('Sample test for Infra Stack', () => {
  let template: Template;

  beforeAll(() => {
    const env = loadAndVerifyEnv(['.env']);

    const app = new App();

    const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
      env: {
        region: env.CDK_DEFAULT_REGION,
        account: env.CDK_DEFAULT_ACCOUNT,
      },
    });

    const stack = new BackendWebSocketApiStack(
      app,
      'BackendWebSocketApiStack',
      {
        env: {
          region: env.CDK_DEFAULT_REGION,
          account: env.CDK_DEFAULT_ACCOUNT,
        },
        webSocketDomainName: env.APP_WEBSOCKET_DOMAIN,
        webSocketDomainCertificate: env.APP_WEBSOCKET_DOMAIN_CERTIFICATE_ARN,
        tables: {
          roomsTable: databaseStack.roomsTable,
        },
      },
    );

    template = Template.fromStack(stack);
  });

  test('sample test', () => {
    expect(template).toBeDefined();
  });
});
