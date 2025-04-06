import { RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import type { Construct } from 'constructs';

export class DatabaseStack extends Stack {
  public readonly roomsTable: Table;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.roomsTable = new Table(this, 'PlanningPokerRoomsTable', {
      tableName: 'rooms',
      partitionKey: {
        name: 'roomId',
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
