import { DiscoveryServiceExternal } from "./DiscoveryServiceExternal";
import { ExtendedGroupEndpoints } from "../../../../../../cdk-ts-common/types";
import { App } from "../../../../../../cdk-ts-common/deployment/node_modules/aws-cdk-lib";
import * as fs from "fs";
import * as path from "path"
    const currentWorkingDir = process.cwd();
    console.log('Current working directory:', currentWorkingDir);
export const extendedGroupEndpoints: ExtendedGroupEndpoints = JSON.parse(fs.readFileSync(path.join(__dirname,"../inputs/inputs.json"), "utf-8"));

const app = new App();

export function main(app: App) {
  for (const [deploymentGroup, deploymentGroupObj] of Object.entries(extendedGroupEndpoints)) {
    const gatewayName = Object.keys(deploymentGroupObj)[0];
    const { stage } = deploymentGroupObj[gatewayName];
    console.log(deploymentGroupObj[gatewayName]);
    const { key } = deploymentGroupObj[gatewayName].features.DiscoveryService;
    const discoveryServiceExternal = new DiscoveryServiceExternal(app, `${deploymentGroup}-${stage}`, deploymentGroupObj);
    discoveryServiceExternal.deploy();
  }
}
