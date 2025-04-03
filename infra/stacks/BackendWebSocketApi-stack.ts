import { Stack, StackProps } from 'aws-cdk-lib';
import { CfnAccount } from 'aws-cdk-lib/aws-apigateway';
import {
  CfnIntegration,
  CfnIntegrationResponse,
  CfnRoute,
  CfnRouteResponse,
  DomainName,
  EndpointType,
  WebSocketApi,
  WebSocketStage,
  type CfnStage,
} from 'aws-cdk-lib/aws-apigatewayv2';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Alias, Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface BackendWebSocketApiStackProps extends StackProps {
  webSocketDomainName: string;
  webSocketDomainCertificate: string;
}

export class BackendWebSocketApiStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: BackendWebSocketApiStackProps,
  ) {
    super(scope, id, props);

    const { webSocketDomainName, webSocketDomainCertificate } = props;

    const importedCertificate = Certificate.fromCertificateArn(
      this,
      'PlanningPokerImportedWebSocketCertificateArn',
      webSocketDomainCertificate,
    );

    const account = this.configureCloudWatchRole(this);

    // Lambda function

    const placeholderCode = readFileSync(
      resolve(__dirname, '../assets/placeholderLambdaCode.js'),
    ).toString('utf-8');

    const lambdaFn = new Function(this, 'PlanningPokerFn', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: Code.fromInline(placeholderCode),
    });

    const lambdaFnAlias = new Alias(this, 'PlanningPokerFnAlias', {
      aliasName: 'prod',
      version: lambdaFn.latestVersion,
    });

    // WebSocket API

    const webSocketApi = new WebSocketApi(this, 'PlanningPokerWebSocketApi', {
      apiName: 'PlanningPokerWebSocket',
      routeSelectionExpression: '$request.body.action',
    });

    const requestTemplate = readFileSync(
      resolve(__dirname, '../assets/websocket integration request template.vm'),
    ).toString('utf-8');

    const responseTemplate = readFileSync(
      resolve(
        __dirname,
        '../assets/websocket integration response template.vm',
      ),
    ).toString('utf-8');

    // $connect route

    const webSocketConnectRouteRequestIntegration = new CfnIntegration(
      this,
      'PlanningPokerWebSocketApiConnectRouteIntegration',
      {
        apiId: webSocketApi.apiId,
        integrationType: 'AWS',
        integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${lambdaFnAlias.functionArn}/invocations`,
        templateSelectionExpression: '\\$connect',
        requestTemplates: {
          $default: requestTemplate,
        },
      },
    );

    new CfnIntegrationResponse(
      this,
      'PlanningPokerWebSocketConnectRouteIntegrationResponse',
      {
        apiId: webSocketApi.apiId,
        integrationId: webSocketConnectRouteRequestIntegration.ref,
        integrationResponseKey: '$default',
        templateSelectionExpression: '$integration.response.statuscode',
        responseTemplates: {
          '200': '{}',
        },
      },
    );

    const webSocketConnectRoute = new CfnRoute(
      this,
      'PlanningPokerWebSocketConnectRoute',
      {
        apiId: webSocketApi.apiId,
        routeKey: '$connect',
        target: `integrations/${webSocketConnectRouteRequestIntegration.ref}`,
      },
    );

    lambdaFnAlias.addPermission(
      'PlanningPokerWebSocketApiConnectRoutePermission',
      {
        principal: new ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: webSocketApi.arnForExecuteApiV2('$connect', 'prod'),
      },
    );

    new CfnRouteResponse(
      this,
      'PlanningPokerWebSocketApiConnectRouteResponse',
      {
        apiId: webSocketApi.apiId,
        routeId: webSocketConnectRoute.ref,
        routeResponseKey: '$default',
      },
    );

    // $default route

    const webSocketDefaultRouteRequestIntegration = new CfnIntegration(
      this,
      'PlanningPokerWebSocketApiDefaultRouteIntegration',
      {
        apiId: webSocketApi.apiId,
        integrationType: 'AWS',
        integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${lambdaFnAlias.functionArn}/invocations`,
        templateSelectionExpression: '\\$default',
        requestTemplates: {
          $default: requestTemplate,
        },
      },
    );

    new CfnIntegrationResponse(
      this,
      'PlanningPokerWebSocketDefaultRouteIntegrationResponse',
      {
        apiId: webSocketApi.apiId,
        integrationId: webSocketDefaultRouteRequestIntegration.ref,
        integrationResponseKey: '$default',
        templateSelectionExpression: '$integration.response.statuscode',
        responseTemplates: {
          '200': responseTemplate,
        },
      },
    );

    const webSocketDefaultRoute = new CfnRoute(
      this,
      'PlanningPokerWebSocketDefaultRoute',
      {
        apiId: webSocketApi.apiId,
        routeKey: '$default',
        routeResponseSelectionExpression: '$default',
        target: `integrations/${webSocketDefaultRouteRequestIntegration.ref}`,
      },
    );

    lambdaFnAlias.addPermission(
      'PlanningPokerWebSocketApiDefaultRoutePermission',
      {
        principal: new ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: webSocketApi.arnForExecuteApiV2('$default', 'prod'),
      },
    );

    new CfnRouteResponse(
      this,
      'PlanningPokerWebSocketApiDefaultRouteResponse',
      {
        apiId: webSocketApi.apiId,
        routeId: webSocketDefaultRoute.ref,
        routeResponseKey: '$default',
      },
    );

    webSocketApi.node.addDependency(account);

    // Stage + Domain mapping

    const domainName = new DomainName(
      this,
      'PlanningPokerWebSocketApiDomainName',
      {
        domainName: webSocketDomainName,
        certificate: importedCertificate,
        endpointType: EndpointType.REGIONAL,
      },
    );

    const stage = new WebSocketStage(
      this,
      'PlanningPokerWebSocketApiProdStage',
      {
        stageName: 'prod',
        webSocketApi: webSocketApi,
        autoDeploy: true,
        domainMapping: { domainName: domainName },
      },
    );

    const cfnStage = stage.node.defaultChild as CfnStage;

    const logGroup = new LogGroup(this, 'PlanningPokerWebSocketAccessLogs', {
      retention: RetentionDays.THREE_MONTHS,
    });

    // Following doesn't work 🥲

    // cfnStage.routeSettings = {
    //   DataTraceEnabled: true,
    //   LoggingLevel: 'INFO',
    // };

    cfnStage.accessLogSettings = {
      destinationArn: logGroup.logGroupArn,
      format: JSON.stringify({
        requestId: '$context.requestId',
        ip: '$context.identity.sourceIp',
        caller: '$context.identity.caller',
        user: '$context.identity.user',
        requestTime: '$context.requestTime',
        httpMethod: '$context.httpMethod',
        resourcePath: '$context.resourcePath',
        status: '$context.status',
        protocol: '$context.protocol',
        responseLength: '$context.responseLength',
      }),
    };
  }

  configureCloudWatchRole(stack: Stack) {
    const role = new Role(stack, 'CloudWatchRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs',
        ),
      ],
    });

    return new CfnAccount(stack, 'Account', {
      cloudWatchRoleArn: role.roleArn,
    });
  }
}
