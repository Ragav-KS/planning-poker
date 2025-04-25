import { RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import type { Construct } from 'constructs';

export class DatabaseStack extends Stack {
  public readonly pokerTable: Table;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.pokerTable = new Table(this, 'PokerTable', {
      tableName: 'PokerTable',
      partitionKey: {
        name: 'pk',
        type: AttributeType.STRING,
      },
      timeToLiveAttribute: 'expiresAt',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.pokerTable.addGlobalSecondaryIndex({
      indexName: 'rooms',
      partitionKey: {
        name: 'roomId',
        type: AttributeType.STRING,
      },
    });
  }
}
