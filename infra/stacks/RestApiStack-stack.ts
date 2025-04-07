import { Size, Stack, StackProps } from 'aws-cdk-lib';
import {
  AccessLogFormat,
  BasePathMapping,
  Deployment,
  DomainName,
  EndpointType,
  LambdaIntegration,
  LogGroupLogDestination,
  MethodLoggingLevel,
  RestApi,
  Stage,
} from 'aws-cdk-lib/aws-apigateway';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface RestApiStackProps extends StackProps {
  lambdaFnAliasArn: string;
  restApiDomainCertificate: string;
  restApiDomainName: string;
}

export class RestApiStack extends Stack {
  constructor(scope: Construct, id: string, props: RestApiStackProps) {
    super(scope, id, props);

    const { lambdaFnAliasArn, restApiDomainName, restApiDomainCertificate } =
      props;

    const importedCertificate = Certificate.fromCertificateArn(
      this,
      'PokerImportedDomainCertificateArn',
      restApiDomainCertificate,
    );

    const lambdaFnAlias = Function.fromFunctionAttributes(
      this,
      'ImportedLambdaAlias',
      { functionArn: lambdaFnAliasArn, sameEnvironment: true },
    );

    // Rest API

    const restApi = new RestApi(this, 'PokerRestApi', {
      deploy: false,
      minCompressionSize: Size.bytes(500),
    });

    restApi.root.addResource('api').addProxy({
      anyMethod: true,
      defaultIntegration: new LambdaIntegration(lambdaFnAlias, {
        proxy: true,
      }),
    });

    const prodStage = new Stage(this, 'PokerRestApiStage', {
      deployment: new Deployment(this, 'PokerRestApiDeployment', {
        api: restApi,
      }),
      tracingEnabled: true,
      dataTraceEnabled: true,
      loggingLevel: MethodLoggingLevel.INFO,
      stageName: 'prod',
      accessLogDestination: new LogGroupLogDestination(
        new LogGroup(this, 'PokerRestApiAccessLogs', {
          logGroupName: 'PokerRestApiAccessLogs',
          retention: RetentionDays.THREE_MONTHS,
        }),
      ),
      accessLogFormat: AccessLogFormat.jsonWithStandardFields({
        httpMethod: true,
        ip: true,
        protocol: true,
        requestTime: true,
        resourcePath: true,
        responseLength: true,
        status: true,
        caller: true,
        user: true,
      }),
    });

    const domainName = new DomainName(this, 'PokerRestApiDomainName', {
      domainName: restApiDomainName,
      certificate: importedCertificate,
      endpointType: EndpointType.REGIONAL,
    });

    new BasePathMapping(this, 'PokerBasePathMapping', {
      domainName,
      restApi,
      stage: prodStage,
    });
  }
}
