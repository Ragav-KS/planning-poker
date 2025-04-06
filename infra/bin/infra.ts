#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { BackendWebSocketApiStack } from '../stacks/BackendWebSocketApi-stack';
import { DatabaseStack } from '../stacks/Database-stack';
import { loadAndVerifyEnv } from '../utils/loadEnv';

const env = loadAndVerifyEnv();

// CDK env variables
const defaultAccount = env.CDK_DEFAULT_ACCOUNT;
const defaultRegion = env.CDK_DEFAULT_REGION;

// App specific env variables
const webSocketDomainName = env.APP_WEBSOCKET_DOMAIN;
const webSocketDomainCertArn = env.APP_WEBSOCKET_DOMAIN_CERTIFICATE_ARN;

const app = new App();

const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env: {
    account: defaultAccount,
    region: defaultRegion,
  },
});

new BackendWebSocketApiStack(app, 'BackendWebSocketApiStack', {
  env: {
    account: defaultAccount,
    region: defaultRegion,
  },
  webSocketDomainName: webSocketDomainName,
  webSocketDomainCertificate: webSocketDomainCertArn,
  tables: {
    roomsTable: databaseStack.roomsTable,
  },
});
