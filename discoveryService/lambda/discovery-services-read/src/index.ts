import * as AWSXRayCore from "aws-xray-sdk-core";
import * as RESPONSE_TYPES from "./responseTypes.json";
const AWS_REGION = "ap-southeast-2";
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const DISCOVERY_SERVICE_TABLE_NAME = process.env.DISCOVERY_SERVICE_TABLE_NAME || "discoveryService";
const VERSION = "-V0";

const DEFAULT_APP_ANDROID = "ANDROID";
const DEFAULT_APP_IOS = "IOS";
const DEFAULT_APP_REGION = "au";
const DEFAULT_APP_CONSUMER = "TalkSite";
const DEFAULT_GROUP_ID = "DEFAULT_GROUP_ID";

const DISCOVERY_SERVICES_PK = "SERVICES";
const DISCOVERY_SERVICES_SK_PREFIX = "SERVICE_";

const marshallOptions = {
  // Whether to automatically convert empty strings, blobs, and sets to `null`.
  convertEmptyValues: false, // false, by default.
  // Whether to remove undefined values while marshalling.
  removeUndefinedValues: false, // false, by default.
  // Whether to convert typeof object to map attribute.
  convertClassInstanceToMap: false, // false, by default.
};

const unmarshallOptions = {
  // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
  wrapNumbers: false, // false, by default.
};

const translateConfig = { marshallOptions, unmarshallOptions };

const ddbClient = new DynamoDBClient({ region: AWS_REGION });
AWSXRayCore.captureAWSv3Client(ddbClient);

// Create the DynamoDB Document client.
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);

type Event = {
  headers: Record<string, string | undefined>;
  pathParameters: { serviceId: string };
};

type Response =
  | {
      statusCode: number;
      body: {
        title: string;
        code: number;
        href: string;
      };
    }
  | {
      statusCode: number;
      body: {
        title: string;
        message: string;
        code: number;
        name: string;
        detail: string;
        href: string;
        type: string;
      };
    };

const ResponseBuilder = async (response: Response) => {
  const segment = AWSXRayCore.getSegment()!;
  const subsegment = segment.addNewSubsegment("ResponseBuilder");
  let headers = {};

  headers = {
    ...headers,
    "content-type": "application/json",
    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
  };

  let body = { ...response.body };

  subsegment.close();
  return {
    statusCode: response.statusCode,
    body: JSON.stringify(body),
    headers,
  };
};

const ResponseBuilderExtended = (response: Response, data: string | Record<string, string | Record<string, string>>) => {
  const segment = AWSXRayCore.getSegment()!;
  const subsegment = segment.addNewSubsegment("ResponseBuilderExtended");
  let body = { ...response.body, data };
  subsegment.close();
  return { statusCode: response.statusCode, body };
};

export const handler = async (event: Event) => {
  const segment: AWSXRayCore.Segment | AWSXRayCore.Subsegment | undefined = AWSXRayCore.getSegment()!;
  const subsegment: AWSXRayCore.Subsegment | undefined = segment.addNewSubsegment("handler");
  try {
    console.log(event);
    const response = await dispatcher(event);
    subsegment.close();
    segment.close();
    return response;
  } catch (error) {
    console.log(error);
    const errorStr = JSON.stringify(error);
    subsegment.close();
    segment.close();
    return ResponseBuilder(RESPONSE_TYPES.INTERNAL_SERVER_ERROR);
  }
};

const dispatcher = async (request: Event) => {
  const segment: AWSXRayCore.Segment | AWSXRayCore.Subsegment | undefined = AWSXRayCore.getSegment()!;
  const subsegment: AWSXRayCore.Subsegment | undefined = segment.addNewSubsegment("dispatcher");
  try {
    let {
      pathParameters: { serviceId },
    } = request;

    let { headers } = request;

    if (!serviceId) {
      subsegment.close();
      return ResponseBuilder(RESPONSE_TYPES.NO_SERVICE_ID);
    }

    const {
      authorization = null,
      "x-correlation-id": correlationId = null,
      "x-app-os": appOS = null,
      "x-app-version": appVersion = null,
      "x-app-name": appName = null,
      "x-app-country": appCountry = null,
      "x-device-id": deviceId = null,
      "x-client-id": clientId = null,
      "x-client-secret": clientSecret = null,
    } = headers;

    if (!authorization) {
      subsegment.close();
      return await ResponseBuilder(RESPONSE_TYPES.NO_AUTHORIZATION);
    }

    if (!correlationId) {
      subsegment.close();
      return await ResponseBuilder(RESPONSE_TYPES.NO_CORRELATION_ID);
    }

    subsegment.addAnnotation("CorrelationId", correlationId);

    if (!appOS) {
      subsegment.close();
      return await ResponseBuilder(RESPONSE_TYPES.NO_APP_OS);
    }

    if (appOS.toUpperCase().localeCompare(DEFAULT_APP_ANDROID) !== 0 && appOS.toUpperCase().localeCompare(DEFAULT_APP_IOS) !== 0) {
      subsegment.close();
      return await ResponseBuilder(RESPONSE_TYPES.INVALID_APP_OS);
    }

    if (!appVersion) {
      subsegment.close();
      return await ResponseBuilder(RESPONSE_TYPES.NO_APP_VERSION);
    }

    if (!appName) {
      subsegment.close();
      return await ResponseBuilder(RESPONSE_TYPES.NO_APP_NAME);
    }

    if (appName.localeCompare(DEFAULT_APP_CONSUMER) !== 0) {
      subsegment.close();
      return await ResponseBuilder(RESPONSE_TYPES.INVALID_APP_NAME);
    }

    if (!appCountry) {
      subsegment.close();
      return await ResponseBuilder(RESPONSE_TYPES.NO_APP_COUNTRY);
    }

    if (appCountry.localeCompare(DEFAULT_APP_REGION) !== 0) {
      subsegment.close();
      return await ResponseBuilder(RESPONSE_TYPES.INVALID_APP_COUNTRY);
    }

    if (!deviceId) {
      subsegment.close();
      return await ResponseBuilder(RESPONSE_TYPES.NO_DEVICE_ID);
    }

    if (!clientId) {
      subsegment.close();
      return await ResponseBuilder(RESPONSE_TYPES.NO_CLIENT_ID);
    }

    if (!clientSecret) {
      subsegment.close();
      return await ResponseBuilder(RESPONSE_TYPES.NO_CLIENT_SECRET);
    }

    let serviceData = await getServiceDetails(serviceId);

    if (serviceData.error) {
      subsegment.close();
      return ResponseBuilder(ResponseBuilderExtended(RESPONSE_TYPES.DATABASE_ERROR, serviceData));
    }

    let response: Response;

    if (serviceData.Item) {
      response = ResponseBuilderExtended(RESPONSE_TYPES.REQUEST_SUCCESS, {
        service: {
          serviceId: serviceData.Item.serviceId,
          url: serviceData.Item.url,
          method: serviceData.Item.method,
          resource: serviceData.Item.resource,
          mappedUrl: serviceData.Item.mappedUrl,
        },
      });
      subsegment.close();
    } else {
      response = ResponseBuilderExtended(RESPONSE_TYPES.NOT_FOUND, "No services available");
    }

    subsegment.close();
    return await ResponseBuilder(response);
  } catch (error) {
    console.log("Dispatcher Exception", error);
    subsegment.close();
    return ResponseBuilder(RESPONSE_TYPES.INTERNAL_SERVER_ERROR);
  }
};

async function getServiceDetails(sk: string) {
  const segment: AWSXRayCore.Segment | AWSXRayCore.Subsegment | undefined = AWSXRayCore.getSegment()!;
  const subsegment: AWSXRayCore.Subsegment | undefined = segment.addNewSubsegment("getServiceDetails");
  try {
    const params = {
      TableName: DISCOVERY_SERVICE_TABLE_NAME,
      Key: {
        pk: DISCOVERY_SERVICES_PK,
        sk: `${DISCOVERY_SERVICES_SK_PREFIX}${sk}`,
      },
    };
    console.log(params);
    const serviceData = await ddbDocClient.send(new GetCommand(params));

    console.log(serviceData);
    subsegment.close();
    return serviceData;
  } catch (error: any) {
    console.log(error);
    subsegment.close();
    return { error, message: error["__type"].split("#")[1] };
  }
}
