import { Stack, type StackProps } from 'aws-cdk-lib';
import type { Table } from 'aws-cdk-lib/aws-dynamodb';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
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
    usersTable: Table;
  };
}

export class BackendLambdaStack extends Stack {
  public readonly lambdaExecutionRole: Role;
  public readonly lambdaFnAlias: Alias;

  constructor(scope: Construct, id: string, props: BackendLambdaStackProps) {
    super(scope, id, props);

    const {
      appJwtSecretKey,
      tables: { usersTable },
    } = props;

    const placeholderCode = readFileSync(
      resolve(__dirname, '../assets/placeholderLambdaCode.js'),
    ).toString('utf-8');

    this.lambdaExecutionRole = new Role(this, 'PokerFnExecutionRole', {
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    const lambdaFn = new Function(this, 'PokerFn', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: Code.fromInline(placeholderCode),
      role: this.lambdaExecutionRole,
      logGroup: new LogGroup(this, 'PokerRestApiAccessLogs', {
        logGroupName: 'PokerLambdaFnLogs',
        retention: RetentionDays.THREE_MONTHS,
      }),
      tracing: Tracing.ACTIVE,
      environment: {
        APP_JWT_SECRET_KEY: appJwtSecretKey,
      },
    });

    this.lambdaFnAlias = new Alias(this, 'PokerFnAlias', {
      aliasName: 'prod',
      version: lambdaFn.latestVersion,
    });

    usersTable.grantReadWriteData(this.lambdaExecutionRole);
  }
}
