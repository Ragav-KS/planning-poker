import { Stack, type StackProps } from 'aws-cdk-lib';
import type { Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  Alias,
  Code,
  Function,
  Runtime,
  Tracing,
} from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { Construct } from 'constructs';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface BackendLambdaStackProps extends StackProps {
  tables: {
    roomsTable: Table;
  };
}

export class BackendLambdaStack extends Stack {
  public readonly lambdaFnAlias: Alias;

  constructor(scope: Construct, id: string, props: BackendLambdaStackProps) {
    super(scope, id, props);

    const {
      tables: { roomsTable },
    } = props;

    const placeholderCode = readFileSync(
      resolve(__dirname, '../assets/placeholderLambdaCode.js'),
    ).toString('utf-8');

    const lambdaFn = new Function(this, 'PokerFn', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: Code.fromInline(placeholderCode),
      logRetention: RetentionDays.THREE_MONTHS,
      tracing: Tracing.ACTIVE,
    });

    this.lambdaFnAlias = new Alias(this, 'PokerFnAlias', {
      aliasName: 'prod',
      version: lambdaFn.latestVersion,
    });

    roomsTable.grantReadWriteData(this.lambdaFnAlias);
  }
}
