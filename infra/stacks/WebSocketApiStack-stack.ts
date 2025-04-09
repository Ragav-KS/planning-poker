import { Stack, StackProps } from 'aws-cdk-lib';
import {
  CfnIntegration,
  CfnIntegrationResponse,
  CfnRoute,
  CfnRouteResponse,
  DomainName,
  EndpointType,
  WebSocketApi,
  WebSocketAuthorizer,
  WebSocketAuthorizerType,
  WebSocketStage,
  type CfnStage,
} from 'aws-cdk-lib/aws-apigatewayv2';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface WebSocketApiStackProps extends StackProps {
  webSocketDomainName: string;
  webSocketDomainCertificate: string;
  backendFnAliasArn: string;
  authorizerFnAliasArn: string;
}

export class WebSocketApiStack extends Stack {
  constructor(scope: Construct, id: string, props: WebSocketApiStackProps) {
    super(scope, id, props);

    const {
      webSocketDomainName,
      webSocketDomainCertificate,
      backendFnAliasArn,
      authorizerFnAliasArn,
    } = props;

    const importedCertificate = Certificate.fromCertificateArn(
      this,
      'PokerImportedDomainCertificateArn',
      webSocketDomainCertificate,
    );

    const backendFnAlias = Function.fromFunctionAttributes(
      this,
      'ImportedBackendFnAlias',
      { functionArn: backendFnAliasArn, sameEnvironment: true },
    );

    const authorizerFnAlias = Function.fromFunctionAttributes(
      this,
      'ImportedAuthorizerFnAlias',
      { functionArn: authorizerFnAliasArn, sameEnvironment: true },
    );

    // WebSocket API

    const webSocketApi = new WebSocketApi(this, 'PokerWebSocket', {
      apiName: 'PokerWebSocket',
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
      'PokerWebSocketConnectRouteIntegration',
      {
        apiId: webSocketApi.apiId,
        integrationType: 'AWS',
        integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${backendFnAlias.functionArn}/invocations`,
        templateSelectionExpression: '\\$connect',
        requestTemplates: {
          $default: requestTemplate,
        },
      },
    );

    new CfnIntegrationResponse(
      this,
      'PokerWebSocketConnectRouteIntegrationResponse',
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

    const authorizer = new WebSocketAuthorizer(
      this,
      'PokerWebSocketAuthorizer',
      {
        webSocketApi: webSocketApi,
        type: WebSocketAuthorizerType.LAMBDA,
        identitySource: ['route.request.header.Authorization'],
        authorizerName: 'PokerWebSocketAuthorizer',
        authorizerUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${authorizerFnAlias.functionArn}/invocations`,
      },
    );

    authorizerFnAlias.addPermission('PokerWebSocketAuthorizer', {
      principal: new ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: webSocketApi.arnForExecuteApiV2(
        authorizer.authorizerId,
        'authorizers',
      ),
    });

    const webSocketConnectRoute = new CfnRoute(
      this,
      'PokerWebSocketConnectRoute',
      {
        apiId: webSocketApi.apiId,
        routeKey: '$connect',
        target: `integrations/${webSocketConnectRouteRequestIntegration.ref}`,
        authorizationType: 'CUSTOM',
        authorizerId: authorizer.authorizerId,
      },
    );

    backendFnAlias.addPermission('PokerWebSocketConnectRoutePermission', {
      principal: new ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: webSocketApi.arnForExecuteApiV2('$connect', 'prod'),
    });

    new CfnRouteResponse(this, 'PokerWebSocketConnectRouteResponse', {
      apiId: webSocketApi.apiId,
      routeId: webSocketConnectRoute.ref,
      routeResponseKey: '$default',
    });

    // $default route

    const webSocketDefaultRouteRequestIntegration = new CfnIntegration(
      this,
      'PokerWebSocketDefaultRouteIntegration',
      {
        apiId: webSocketApi.apiId,
        integrationType: 'AWS',
        integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${backendFnAlias.functionArn}/invocations`,
        templateSelectionExpression: '\\$default',
        requestTemplates: {
          $default: requestTemplate,
        },
      },
    );

    new CfnIntegrationResponse(
      this,
      'PokerWebSocketDefaultRouteIntegrationResponse',
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
      'PokerWebSocketDefaultRoute',
      {
        apiId: webSocketApi.apiId,
        routeKey: '$default',
        routeResponseSelectionExpression: '$default',
        target: `integrations/${webSocketDefaultRouteRequestIntegration.ref}`,
      },
    );

    backendFnAlias.addPermission('PokerWebSocketDefaultRoutePermission', {
      principal: new ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: webSocketApi.arnForExecuteApiV2('$default', 'prod'),
    });

    new CfnRouteResponse(this, 'PokerWebSocketDefaultRouteResponse', {
      apiId: webSocketApi.apiId,
      routeId: webSocketDefaultRoute.ref,
      routeResponseKey: '$default',
    });

    // Stage + Domain mapping

    const domainName = new DomainName(this, 'PokerWebSocketDomainName', {
      domainName: webSocketDomainName,
      certificate: importedCertificate,
      endpointType: EndpointType.REGIONAL,
    });

    const stage = new WebSocketStage(this, 'PokerWebSocketProdStage', {
      stageName: 'prod',
      webSocketApi: webSocketApi,
      autoDeploy: true,
      domainMapping: { domainName: domainName },
    });

    const cfnStage = stage.node.defaultChild as CfnStage;

    const logGroup = new LogGroup(this, 'PokerWebSocketAccessLogs', {
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
}
