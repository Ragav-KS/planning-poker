import { Stack, type StackProps } from 'aws-cdk-lib';
import type { Table } from 'aws-cdk-lib/aws-dynamodb';
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

interface BackendLambdaStackProps extends StackProps {
  appJwtSecretKey: string;
  tables: {
    roomsTable: Table;
  };
}

export class BackendLambdaStack extends Stack {
  public readonly lambdaFnAlias: Alias;

  constructor(scope: Construct, id: string, props: BackendLambdaStackProps) {
    super(scope, id, props);

    const {
      appJwtSecretKey,
      tables: { roomsTable },
    } = props;

    const placeholderCode = readFileSync(
      resolve(__dirname, '../assets/placeholderLambdaCode.js'),
    ).toString('utf-8');

    const lambdaFn = new Function(this, 'PokerFn', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: Code.fromInline(placeholderCode),
      logGroup: new LogGroup(this, 'PokerRestApiAccessLogs', {
        logGroupName: 'PokerLambdaFnLogs',
        retention: RetentionDays.THREE_MONTHS,
      }),
      tracing: Tracing.ACTIVE,
      environment: {
        APP_JWT_SECRET_KEY: appJwtSecretKey
      }
    });

    this.lambdaFnAlias = new Alias(this, 'PokerFnAlias', {
      aliasName: 'prod',
      version: lambdaFn.latestVersion,
    });

    roomsTable.grantReadWriteData(this.lambdaFnAlias);
  }
}
