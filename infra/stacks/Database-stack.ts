import { RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import type { Construct } from 'constructs';

export class DatabaseStack extends Stack {
  public readonly usersTable: Table;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.usersTable = new Table(this, 'UsersTable', {
      tableName: 'Poker-UsersTable',
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
