import * as AWSXRayCore from "aws-xray-sdk-core";
import * as RESPONSE_TYPES from "./responseTypes.json";
const AWS_REGION = "ap-southeast-2";
const { DynamoDBDocumentClient, BatchGetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const DISCOVERY_SERVICE_TABLE_NAME = process.env.DISCOVERY_SERVICE_TABLE_NAME || "discoveryService";
const VERSION = "-V0";
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_NEXT_PAGE_KEY = "false";
const DEFAULT_APP_ANDROID = "ANDROID";
const DEFAULT_APP_IOS = "IOS";
const DEFAULT_APP_REGION = "au";
const DEFAULT_APP_CONSUMER = "TalkSite";

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
  body: string;
  headers: Record<string, string | undefined>;
  queryStringParameters: {
    pageSize: number;
    nextPageKey: string;
    pageKey: string;
    search: string;
  };
};
type RequestBody = {
  service: string;
  resource: string;
  operation: string;
  ids: string[];
};

type LambdaResponse = {
  statusCode: number;
  body: string;
  headers: {};
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
type BatchParam = {
  RequestItems: {
    [x: string]: {
      Keys: object[];
    };
  };
};

type DatabaseResponse = {
  sk: string;
  Responses: {
    data: object[];
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

const ResponseBuilderExtended = (response: Response, data: string | Record<string, object | string | undefined | number>) => {
  const segment = AWSXRayCore.getSegment()!;
  const subsegment = segment.addNewSubsegment("ResponseBuilderExtended");
  let body = { ...response.body, data };
  subsegment.close();
  return { statusCode: response.statusCode, body };
};

exports.handler = async (event: Event) => {
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
    let { headers, queryStringParameters } = request;
    let pageSize = DEFAULT_PAGE_SIZE;
    let pageKey;

    if (queryStringParameters) {
      pageSize = queryStringParameters.pageSize;
      pageKey = queryStringParameters.pageKey;
    }

    if (!pageSize) {
      pageSize = DEFAULT_PAGE_SIZE;
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
    let ids = [];
    if (queryStringParameters && queryStringParameters.search) {
      ids = JSON.parse(queryStringParameters.search).serviceIds;
    }
    console.log(ids);
    console.log(typeof ids);
    let nextPageKey;
    let lastEvaluatedKey;

    let response: any = {};
    let dataFromDb: any;
    if (ids === undefined || ids.length <= 0) {
      response = await getAllServices(Number(pageSize), pageKey);

      if (response.error) {
        subsegment.close();
        return ResponseBuilder(ResponseBuilderExtended(RESPONSE_TYPES.DATABASE_ERROR, response));
      }

      dataFromDb = response.Items;
      lastEvaluatedKey = response.LastEvaluatedKey;
    } else {
      let batchParam = createBatchParamData(ids);
      response = await getServiceDetails(batchParam);

      if (response.error) {
        subsegment.close();
        return ResponseBuilder(ResponseBuilderExtended(RESPONSE_TYPES.DATABASE_ERROR, response));
      }

      dataFromDb = response.Responses[DISCOVERY_SERVICE_TABLE_NAME];
    }

    if (dataFromDb.length < 0) {
      let noDataResponse = await ResponseBuilder(ResponseBuilderExtended(RESPONSE_TYPES.NOT_FOUND, "No services available"));
      subsegment.close();
      return noDataResponse;
    }

    if (lastEvaluatedKey) {
      nextPageKey = lastEvaluatedKey.sk.split("_")[1];
    }

    response = processResponse(dataFromDb);

    subsegment.close();
    return ResponseBuilder(
      ResponseBuilderExtended(RESPONSE_TYPES.REQUEST_SUCCESS, { count: Object.keys(response).length, discoveryData: response, nextPageKey })
    );
  } catch (error) {
    console.log("Dispatcher Exception", error);
    subsegment.close();
    return ResponseBuilder(RESPONSE_TYPES.INTERNAL_SERVER_ERROR);
  }
};

function createBatchParamData(serviceKeys: string[]) {
  const segment: AWSXRayCore.Segment | AWSXRayCore.Subsegment | undefined = AWSXRayCore.getSegment()!;
  const subsegment: AWSXRayCore.Subsegment | undefined = segment.addNewSubsegment("createBatchParamData");

  let requestItemsArray: object[] = [];
  for (let i = 0; i < serviceKeys.length; i++) {
    let params = {
      pk: "SERVICES",
      sk: `SERVICE_${serviceKeys[i].toLowerCase()}`,
    };
    requestItemsArray.push(params);
  }
  let batchParams = {
    RequestItems: {
      [DISCOVERY_SERVICE_TABLE_NAME]: { Keys: requestItemsArray },
    },
  };
  subsegment.close();
  return batchParams;
}

async function getServiceDetails(batchParam: BatchParam) {
  const segment: AWSXRayCore.Segment | AWSXRayCore.Subsegment | undefined = AWSXRayCore.getSegment()!;
  const subsegment: AWSXRayCore.Subsegment | undefined = segment.addNewSubsegment("getServiceDetails");
  try {
    console.log("batchparams");
    console.log(JSON.stringify(batchParam));
    const response = await ddbDocClient.send(new BatchGetCommand(batchParam));
    console.log(response);

    subsegment.close();
    return response;
  } catch (error) {
    console.log("Database Exception", error);
    subsegment.close();
    return { error, message: error["__type"].split("#")[1] };
  }
}

async function getAllServices(pageSize: number, pageKey: undefined | string) {
  const segment: AWSXRayCore.Segment | AWSXRayCore.Subsegment | undefined = AWSXRayCore.getSegment()!;
  const subsegment: AWSXRayCore.Subsegment | undefined = segment.addNewSubsegment("getServiceDetails");
  try {
    let ExclusiveStartKey;
    if (pageKey) {
      ExclusiveStartKey = { pk: "SERVICES", sk: `SERVICE_${pageKey}` };
    }
    let sk = `SERVICE_`;

    const params = {
      TableName: DISCOVERY_SERVICE_TABLE_NAME,
      Limit: pageSize,
      ExclusiveStartKey,
      ExpressionAttributeValues: {
        ":pk": `SERVICES`,
        ":sk": sk,
      },
      KeyConditionExpression: `pk = :pk and  begins_with(sk, :sk)`,
    };
    console.log("QueryCommand params: ", params);
    let response = await ddbDocClient.send(new QueryCommand(params));
    subsegment.close();
    return response;
  } catch (error) {
    console.log("Database Exception", error);
    subsegment.close();
    return { error, message: error["__type"].split("#")[1] };
  }
}

function processResponse(unprocessedData: any[]) {
  let processedData = {};
  unprocessedData.forEach((service) => {
    processedData[service.serviceId] = {
      serviceId: service.serviceId,
      url: service.url,
      method: service.method,
      resource: service.resource,
      mappedUrl: service.mappedUrl,
    };
  });

  return processedData;
}
