import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { beforeAll, describe, expect, test } from 'vitest';
import { InfraStack } from './infra-stack';

describe('Sample test for Infra Stack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new App();

    const stack = new InfraStack(app, 'InfraStack', {
      env: {
        region: 'ap-south-1',
        account: '999999999999',
      },
    });

    template = Template.fromStack(stack);
  });

  test('sample test', () => {
    expect(template).toBeDefined();
  });
});
