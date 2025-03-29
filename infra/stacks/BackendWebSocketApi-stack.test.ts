import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { beforeAll, describe, expect, test } from 'vitest';
import { loadAndVerifyEnv } from '../utils/loadEnv';
import { BackendWebSocketApiStack } from './BackendWebSocketApi-stack';

describe('Sample test for Infra Stack', () => {
  let template: Template;

  beforeAll(() => {
    const env = loadAndVerifyEnv(['.env']);

    const app = new App();

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
      },
    );

    template = Template.fromStack(stack);
  });

  test('sample test', () => {
    expect(template).toBeDefined();
  });
});
