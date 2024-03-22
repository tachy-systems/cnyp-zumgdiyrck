import { ExtendedGroupEndpoints } from "../../../cdk-ts-common/types";
import { App } from "../../../cdk-ts-common/deployment/node_modules/aws-cdk-lib";
import * as fs from "fs";
import { DeploymentStack } from "./DeploymentStack";
// import { main } from "../../2_CodeProducer/outputs/discoveryService/deployment/app";

export const extendedGroupEndpoints: ExtendedGroupEndpoints = JSON.parse(fs.readFileSync("./inputs/extendedGroupEndpoints.json", "utf-8"));
const app = new App();
let isDiscoveryServiceEnabled = false;

for (const [deploymentGroup, deploymentGroupObj] of Object.entries(extendedGroupEndpoints)) {
  const gatewayName = Object.keys(deploymentGroupObj)[0];
  const { stage } = deploymentGroupObj[gatewayName];

  if (deploymentGroupObj[gatewayName].features.DiscoveryService) {
    isDiscoveryServiceEnabled = true;
  }

  const deploymentStack = new DeploymentStack(app, `${deploymentGroup}-${stage}`, deploymentGroupObj);
  deploymentStack.deploy();
}

console.log("isDiscoveryServiceEnabled: ", isDiscoveryServiceEnabled);

// if (isDiscoveryServiceEnabled) {
//   main(app);
// }

if (isDiscoveryServiceEnabled) {
  import(`../2_CodeProducer/outputs/discoveryService/deployment/app`)
    .then(({ main }) => {
      if (main) {
        main(app);
      } else {
        console.error("Main function is not available in the discovery service module.");
      }
    })
    .catch(error => {
      console.error("Error occurred while importing the discovery service module:", error);
    });
}
