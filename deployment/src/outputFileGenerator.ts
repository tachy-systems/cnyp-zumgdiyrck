import { ExtendedEndpoint, OutputData, ExtendedGroupEndpoints } from "../../../cdk-ts-common/types";
import { WriterType, WriterFactory } from "../../../cdk-ts-common/deployment/src/Writers/OutputWriterFactory";
import * as fs from "fs";
import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
const AWS_REGION = process.env.AWS_REGION || "ap-southeast-2";
const client = new CloudFormationClient({ region: AWS_REGION });
let apiIdCache = {};

const extendedGroupEndpoints: ExtendedGroupEndpoints = JSON.parse(fs.readFileSync("./inputs/extendedGroupEndpoints.json", "utf-8"));

export class ApiCodeGenOutputWriter {
  protected outputType: WriterType;
  protected endpoints: ExtendedEndpoint[];
  protected outputData: OutputData[] = [];
  protected outputFileDirectory: string;
  protected GIT_REPO_USER_NAME: string;

  constructor() {
    this.outputFileDirectory = "../../api-code-gen/6_Deployer/outputs";
    this.outputType = WriterType.JSON;
    this.GIT_REPO_USER_NAME = "tachy-systems";
  }

  async writeOutputFile(): Promise<void> {
    await this.createOutputData();
    await this.generateOutputFile();
  }

  async createOutputData() {
    for (const [deploymentGroup, deploymentGroupObj] of Object.entries(extendedGroupEndpoints)) {
      for (const [gatewayGroup, gatewayGroupObj] of Object.entries(deploymentGroupObj)) {
        this.outputType = gatewayGroupObj.outputType!;
        const endpoints = gatewayGroupObj.endpointsInfoArray;
        for (const endpoint of endpoints) {
          let endpointData: OutputData = <OutputData>{};
          endpointData["id"] = endpoint.id!;
          endpointData["endpointId"] = endpoint.endpointId;
          endpointData["stackName"] = deploymentGroup;
          endpointData["projectName"] = endpoint.projectName;
          endpointData["projectShortName"] = endpoint.projectShortName;
          endpointData["resourceName"] = endpoint.resourceName;
          endpointData["method"] = endpoint.httpMethod;
          if (endpoint.pathPrefix != "" && endpoint.path === "/") {
            endpoint.path = "";
          }
          endpointData["url"] = `https://${endpoint.serverUrl}/${endpoint.resourceName}${endpoint.pathPrefix}${endpoint.path}`;
          endpointData["awsUrl"] = `https://${await getApiId(
            `${deploymentGroup}-${endpoint.stage}`,
            `${gatewayGroup}-id-${endpoint.stage}`
          )}.execute-api.${gatewayGroupObj.region}.amazonaws.com${endpoint.pathPrefix}${endpoint.path}`;
          endpointData["sourceRepoUrl"] = `https://github.com/${this.GIT_REPO_USER_NAME}/${endpoint.projectShortName}-${endpoint.projectId}.git`;
          this.outputData.push(endpointData);
        }
      }
    }
  }

  async generateOutputFile() {
    const { outputFileDirectory, outputData, outputType } = this;
    const outputWriter = WriterFactory.create(outputType, { outputFileDirectory, outputData });
    console.log("Writing output data\n");
    await outputWriter.writeData();
  }
}

const apiCodeGenOutputWriter = new ApiCodeGenOutputWriter();
apiCodeGenOutputWriter.writeOutputFile();

async function getApiId(stackName: string, apiGatewayName: string) {
  if (apiIdCache[stackName]) {
    return apiIdCache[stackName];
  }

  try {
    const command = new DescribeStacksCommand({ StackName: stackName });
    const response = await client.send(command);
    console.log("response: ", response.Stacks![0].Outputs);

    for (const output of response.Stacks![0].Outputs!) {
      console.log(stackName, apiGatewayName);
      if (output.ExportName === apiGatewayName) {
        apiIdCache[stackName] = output.OutputValue;
        break; // Exit the loop after finding the desired value
      }
    }
    return apiIdCache[stackName];
  } catch (error) {
    console.log("Error happened while getting apiId from cloudformation");
    console.log(error);
    throw new Error(`Error happened while getting apiId from cloudformation: ${error}`);
  }
}
