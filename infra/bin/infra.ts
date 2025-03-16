#!/usr/bin/env node
import { config } from '@dotenvx/dotenvx';
import { App } from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';

config({ path: ['.env', '.env.local'], override: process.env.CI !== 'true' });

const defaultAccount = process.env.CDK_DEFAULT_ACCOUNT;
const defaultRegion = process.env.CDK_DEFAULT_REGION;

const app = new App();

new InfraStack(app, 'InfraStack', {
  env: {
    account: defaultAccount,
    region: defaultRegion,
  },
});
