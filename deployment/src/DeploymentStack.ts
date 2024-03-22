import { GateWayGroup } from "../../../cdk-ts-common/types";
import * as ENUMS from "../../../cdk-ts-common/enums";
import { AwsServerlessStackBase } from "../../../cdk-ts-common/deployment/src/AwsServerlessStackBase";
import { DiscoveryServiceDefaultData } from "../../../cdk-ts-common/deployment/src/DiscoveryServiceDefaultData";
import { DiscoveryServiceConfigurator } from "../../../cdk-ts-common/deployment/src/DiscoveryServiceConfigurator";
import { App , CfnOutput} from "../../../cdk-ts-common/deployment/node_modules/aws-cdk-lib";
import * as fileSystemPath from "path";
import * as lambda from "../../../cdk-ts-common/deployment/node_modules/aws-cdk-lib/aws-lambda";
import * as iam from "../../../cdk-ts-common/deployment/node_modules/aws-cdk-lib/aws-iam";
import { extendedGroupEndpoints } from "./app";

export class DeploymentStack extends AwsServerlessStackBase {
  protected apiGatewayObj: GateWayGroup;
  constructor(
    scope: App,
    id: string,
    props: {
      [gatewayGroup: string]: GateWayGroup;
    }
  ) {
    super(scope, id, {
      env: {
        region: process.env.CDK_DEFAULT_REGION!,
        account: process.env.CDK_DEFAULT_ACCOUNT!,
      },
    });

    this.defaultData = new DiscoveryServiceDefaultData(extendedGroupEndpoints);
    this.defaultData.initializeValues();

    this.apiGatewayObj = Object.values(props)[0];
    this.apiGatewayName = Object.keys(props)[0];
    this.stage = this.apiGatewayObj.stage;
    this.resourceName = this.apiGatewayObj.endpointsInfoArray[0].resourceName;
    this.dsConfigurator = new DiscoveryServiceConfigurator({ parentStack: this, stage: this.stage!, resourceName: this.resourceName });
    this.endpoints = this.apiGatewayObj.endpointsInfoArray;
    this.isAuthorizationExists = this.apiGatewayObj.features[ENUMS.ApiFeatures.Authorization];
    this.mappingDomain = this.apiGatewayObj.serverUrl!;
    this.separateHostedZones = this.apiGatewayObj.separateHostedZones!;
    this.outputType = this.apiGatewayObj.outputType!;
    this.outputFileDirectory = "../../api-code-gen/6_Deployer/outputs";
  }

  writeDeploymentConfig() {
    console.log("No need to update configurations");
  }

  async doDeployment(): Promise<void> {
    const { mappingDomain } = this;
    await this.createApiGateway();

    const lambdaRole = new iam.Role(this, "LambdaRole-SystemManagerGetAccess", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["logs:*"],
      })
    );

    this.endpoints.forEach((endpoint) => {
      this.resourceNamesArray.add(endpoint.resourceName);
      const environment = {
        ENDPOINT_DATA: JSON.stringify(endpoint),
      };
      const lambdaPath = lambda.Code.fromAsset(
        fileSystemPath.join(
          __dirname,
          `../../2_CodeProducer/outputs/${endpoint.projectShortName}-${endpoint.projectId}/lambda/${endpoint.serviceMethodName}/src`
        )
      );
      this.createNodejsLambda(endpoint, environment, lambdaPath, {}, lambdaRole);
    });

    this.domainMapping();

    new CfnOutput(this, `${this.apiGatewayName}-id-${this.stage}`, {
      value: this.apiGateway.apiId,
      exportName: `${this.apiGatewayName}-id-${this.stage}`,
    });
  }
}
