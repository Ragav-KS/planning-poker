#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { AuthorizerLambdaStack } from '../stacks/AuthorizerLambda-stack';
import { BackendLambdaStack } from '../stacks/BackendLambda-stack';
import { CloudWatchRoleStack } from '../stacks/CloudWatchRole-stack';
import { DatabaseStack } from '../stacks/Database-stack';
import { RestApiStack } from '../stacks/RestApiStack-stack';
import { WebSocketApiStack } from '../stacks/WebSocketApiStack-stack';
import { loadAndVerifyEnv } from '../utils/loadEnv';

const env = loadAndVerifyEnv();

// CDK env variables
const defaultAccount = env.CDK_DEFAULT_ACCOUNT;
const defaultRegion = env.CDK_DEFAULT_REGION;

// App specific env variables
const appDomainCertArn = env.APP_DOMAIN_CERTIFICATE_ARN;
const restApiDomainName = env.APP_RESTAPI_DOMAIN;
const webSocketDomainName = env.APP_WEBSOCKET_DOMAIN;

const app = new App();

const cloudWatchConfigStack = new CloudWatchRoleStack(
  app,
  'Poker-CloudWatchRoleStack',
  {
    env: {
      account: defaultAccount,
      region: defaultRegion,
    },
  },
);

const databaseStack = new DatabaseStack(app, 'Poker-DatabaseStack', {
  env: {
    account: defaultAccount,
    region: defaultRegion,
  },
});

const backendLambdaStack = new BackendLambdaStack(
  app,
  'Poker-BackendLambdaStack',
  {
    env: {
      account: defaultAccount,
      region: defaultRegion,
    },
    appJwtSecretKey: env.APP_JWT_SECRET_KEY,
    tables: {
      usersTable: databaseStack.usersTable,
    },
  },
);

const httpApiStack = new RestApiStack(app, 'Poker-RestApiStack', {
  env: {
    account: defaultAccount,
    region: defaultRegion,
  },
  lambdaFnAliasArn: backendLambdaStack.lambdaFnAlias.functionArn,
  restApiDomainName: restApiDomainName,
  restApiDomainCertificate: appDomainCertArn,
});
httpApiStack.addDependency(cloudWatchConfigStack);

const authorizerLambdaStack = new AuthorizerLambdaStack(
  app,
  'Poker-AuthorizerLambdaStack',
  {
    env: {
      account: defaultAccount,
      region: defaultRegion,
    },
    appJwtSecretKey: env.APP_JWT_SECRET_KEY,
  },
);

const webSocketApiStack = new WebSocketApiStack(
  app,
  'Poker-WebSocketApiStack',
  {
    env: {
      account: defaultAccount,
      region: defaultRegion,
    },
    webSocketDomainName: webSocketDomainName,
    webSocketDomainCertificate: appDomainCertArn,
    backendFnAliasArn: backendLambdaStack.lambdaFnAlias.functionArn,
    authorizerFnAliasArn: authorizerLambdaStack.authorizerFnAlias.functionArn,
  },
);
webSocketApiStack.addDependency(cloudWatchConfigStack);
