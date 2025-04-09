import { Stack, type StackProps } from 'aws-cdk-lib';
import {
  Alias,
  Code,
  Function,
  Runtime,
  Tracing,
} from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { Construct } from 'constructs';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface AuthorizerLambdaStackProps extends StackProps {
  appJwtSecretKey: string;
}

export class AuthorizerLambdaStack extends Stack {
  public readonly authorizerFnAlias: Alias;

  constructor(scope: Construct, id: string, props: AuthorizerLambdaStackProps) {
    super(scope, id, props);

    const { appJwtSecretKey } = props;

    const placeholderCode = readFileSync(
      resolve(__dirname, '../assets/placeholderLambdaAuthorizerCode.js'),
    ).toString('utf-8');

    const lambdaFn = new Function(this, 'PokerAuthorizerFn', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: Code.fromInline(placeholderCode),
      logGroup: new LogGroup(this, 'PokerAuthorizerFnLogs', {
        logGroupName: 'PokerAuthorizerFnLogs',
        retention: RetentionDays.THREE_MONTHS,
      }),
      tracing: Tracing.ACTIVE,
      environment: {
        APP_JWT_SECRET_KEY: appJwtSecretKey,
      },
    });

    this.authorizerFnAlias = new Alias(this, 'PokerAuthorizerFnAlias', {
      aliasName: 'prod',
      version: lambdaFn.latestVersion,
    });
  }
}
