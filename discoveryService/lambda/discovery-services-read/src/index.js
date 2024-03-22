"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
var AWSXRayCore = __importStar(require("aws-xray-sdk-core"));
var RESPONSE_TYPES = __importStar(require("./responseTypes.json"));
var AWS_REGION = "ap-southeast-2";
var _a = require("@aws-sdk/lib-dynamodb"), DynamoDBDocumentClient = _a.DynamoDBDocumentClient, GetCommand = _a.GetCommand;
var DynamoDBClient = require("@aws-sdk/client-dynamodb").DynamoDBClient;
var DISCOVERY_SERVICE_TABLE_NAME = process.env.DISCOVERY_SERVICE_TABLE_NAME || "discoveryService";
var VERSION = "-V0";
var DEFAULT_APP_ANDROID = "ANDROID";
var DEFAULT_APP_IOS = "IOS";
var DEFAULT_APP_REGION = "au";
var DEFAULT_APP_CONSUMER = "TalkSite";
var DEFAULT_GROUP_ID = "DEFAULT_GROUP_ID";
var DISCOVERY_SERVICES_PK = "SERVICES";
var DISCOVERY_SERVICES_SK_PREFIX = "SERVICE_";
var marshallOptions = {
    // Whether to automatically convert empty strings, blobs, and sets to `null`.
    convertEmptyValues: false, // false, by default.
    // Whether to remove undefined values while marshalling.
    removeUndefinedValues: false, // false, by default.
    // Whether to convert typeof object to map attribute.
    convertClassInstanceToMap: false, // false, by default.
};
var unmarshallOptions = {
    // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
    wrapNumbers: false, // false, by default.
};
var translateConfig = { marshallOptions: marshallOptions, unmarshallOptions: unmarshallOptions };
var ddbClient = new DynamoDBClient({ region: AWS_REGION });
AWSXRayCore.captureAWSv3Client(ddbClient);
// Create the DynamoDB Document client.
var ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);
var ResponseBuilder = function (response) { return __awaiter(void 0, void 0, void 0, function () {
    var segment, subsegment, headers, body;
    return __generator(this, function (_a) {
        segment = AWSXRayCore.getSegment();
        subsegment = segment.addNewSubsegment("ResponseBuilder");
        headers = {};
        headers = __assign(__assign({}, headers), { "content-type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": true, "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept", "Access-Control-Allow-Methods": "OPTIONS,POST,GET" });
        body = __assign({}, response.body);
        subsegment.close();
        return [2 /*return*/, {
                statusCode: response.statusCode,
                body: JSON.stringify(body),
                headers: headers,
            }];
    });
}); };
var ResponseBuilderExtended = function (response, data) {
    var segment = AWSXRayCore.getSegment();
    var subsegment = segment.addNewSubsegment("ResponseBuilderExtended");
    var body = __assign(__assign({}, response.body), { data: data });
    subsegment.close();
    return { statusCode: response.statusCode, body: body };
};
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var segment, subsegment, response, error_1, errorStr;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                segment = AWSXRayCore.getSegment();
                subsegment = segment.addNewSubsegment("handler");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                console.log(event);
                return [4 /*yield*/, dispatcher(event)];
            case 2:
                response = _a.sent();
                subsegment.close();
                segment.close();
                return [2 /*return*/, response];
            case 3:
                error_1 = _a.sent();
                console.log(error_1);
                errorStr = JSON.stringify(error_1);
                subsegment.close();
                segment.close();
                return [2 /*return*/, ResponseBuilder(RESPONSE_TYPES.INTERNAL_SERVER_ERROR)];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.handler = handler;
var dispatcher = function (request) { return __awaiter(void 0, void 0, void 0, function () {
    var segment, subsegment, serviceId, headers, _a, authorization, _b, correlationId, _c, appOS, _d, appVersion, _e, appName, _f, appCountry, _g, deviceId, _h, clientId, _j, clientSecret, serviceData, response, error_2;
    return __generator(this, function (_k) {
        switch (_k.label) {
            case 0:
                segment = AWSXRayCore.getSegment();
                subsegment = segment.addNewSubsegment("dispatcher");
                _k.label = 1;
            case 1:
                _k.trys.push([1, 28, , 29]);
                serviceId = request.pathParameters.serviceId;
                headers = request.headers;
                if (!serviceId) {
                    subsegment.close();
                    return [2 /*return*/, ResponseBuilder(RESPONSE_TYPES.NO_SERVICE_ID)];
                }
                _a = headers.authorization, authorization = _a === void 0 ? null : _a, _b = headers["x-correlation-id"], correlationId = _b === void 0 ? null : _b, _c = headers["x-app-os"], appOS = _c === void 0 ? null : _c, _d = headers["x-app-version"], appVersion = _d === void 0 ? null : _d, _e = headers["x-app-name"], appName = _e === void 0 ? null : _e, _f = headers["x-app-country"], appCountry = _f === void 0 ? null : _f, _g = headers["x-device-id"], deviceId = _g === void 0 ? null : _g, _h = headers["x-client-id"], clientId = _h === void 0 ? null : _h, _j = headers["x-client-secret"], clientSecret = _j === void 0 ? null : _j;
                if (!!authorization) return [3 /*break*/, 3];
                subsegment.close();
                return [4 /*yield*/, ResponseBuilder(RESPONSE_TYPES.NO_AUTHORIZATION)];
            case 2: return [2 /*return*/, _k.sent()];
            case 3:
                if (!!correlationId) return [3 /*break*/, 5];
                subsegment.close();
                return [4 /*yield*/, ResponseBuilder(RESPONSE_TYPES.NO_CORRELATION_ID)];
            case 4: return [2 /*return*/, _k.sent()];
            case 5:
                subsegment.addAnnotation("CorrelationId", correlationId);
                if (!!appOS) return [3 /*break*/, 7];
                subsegment.close();
                return [4 /*yield*/, ResponseBuilder(RESPONSE_TYPES.NO_APP_OS)];
            case 6: return [2 /*return*/, _k.sent()];
            case 7:
                if (!(appOS.toUpperCase().localeCompare(DEFAULT_APP_ANDROID) !== 0 && appOS.toUpperCase().localeCompare(DEFAULT_APP_IOS) !== 0)) return [3 /*break*/, 9];
                subsegment.close();
                return [4 /*yield*/, ResponseBuilder(RESPONSE_TYPES.INVALID_APP_OS)];
            case 8: return [2 /*return*/, _k.sent()];
            case 9:
                if (!!appVersion) return [3 /*break*/, 11];
                subsegment.close();
                return [4 /*yield*/, ResponseBuilder(RESPONSE_TYPES.NO_APP_VERSION)];
            case 10: return [2 /*return*/, _k.sent()];
            case 11:
                if (!!appName) return [3 /*break*/, 13];
                subsegment.close();
                return [4 /*yield*/, ResponseBuilder(RESPONSE_TYPES.NO_APP_NAME)];
            case 12: return [2 /*return*/, _k.sent()];
            case 13:
                if (!(appName.localeCompare(DEFAULT_APP_CONSUMER) !== 0)) return [3 /*break*/, 15];
                subsegment.close();
                return [4 /*yield*/, ResponseBuilder(RESPONSE_TYPES.INVALID_APP_NAME)];
            case 14: return [2 /*return*/, _k.sent()];
            case 15:
                if (!!appCountry) return [3 /*break*/, 17];
                subsegment.close();
                return [4 /*yield*/, ResponseBuilder(RESPONSE_TYPES.NO_APP_COUNTRY)];
            case 16: return [2 /*return*/, _k.sent()];
            case 17:
                if (!(appCountry.localeCompare(DEFAULT_APP_REGION) !== 0)) return [3 /*break*/, 19];
                subsegment.close();
                return [4 /*yield*/, ResponseBuilder(RESPONSE_TYPES.INVALID_APP_COUNTRY)];
            case 18: return [2 /*return*/, _k.sent()];
            case 19:
                if (!!deviceId) return [3 /*break*/, 21];
                subsegment.close();
                return [4 /*yield*/, ResponseBuilder(RESPONSE_TYPES.NO_DEVICE_ID)];
            case 20: return [2 /*return*/, _k.sent()];
            case 21:
                if (!!clientId) return [3 /*break*/, 23];
                subsegment.close();
                return [4 /*yield*/, ResponseBuilder(RESPONSE_TYPES.NO_CLIENT_ID)];
            case 22: return [2 /*return*/, _k.sent()];
            case 23:
                if (!!clientSecret) return [3 /*break*/, 25];
                subsegment.close();
                return [4 /*yield*/, ResponseBuilder(RESPONSE_TYPES.NO_CLIENT_SECRET)];
            case 24: return [2 /*return*/, _k.sent()];
            case 25: return [4 /*yield*/, getServiceDetails(serviceId)];
            case 26:
                serviceData = _k.sent();
                if (serviceData.error) {
                    subsegment.close();
                    return [2 /*return*/, ResponseBuilder(ResponseBuilderExtended(RESPONSE_TYPES.DATABASE_ERROR, serviceData))];
                }
                response = void 0;
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
                }
                else {
                    response = ResponseBuilderExtended(RESPONSE_TYPES.NOT_FOUND, "No services available");
                }
                subsegment.close();
                return [4 /*yield*/, ResponseBuilder(response)];
            case 27: return [2 /*return*/, _k.sent()];
            case 28:
                error_2 = _k.sent();
                console.log("Dispatcher Exception", error_2);
                subsegment.close();
                return [2 /*return*/, ResponseBuilder(RESPONSE_TYPES.INTERNAL_SERVER_ERROR)];
            case 29: return [2 /*return*/];
        }
    });
}); };
function getServiceDetails(sk) {
    return __awaiter(this, void 0, void 0, function () {
        var segment, subsegment, params, serviceData, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    segment = AWSXRayCore.getSegment();
                    subsegment = segment.addNewSubsegment("getServiceDetails");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    params = {
                        TableName: DISCOVERY_SERVICE_TABLE_NAME,
                        Key: {
                            pk: DISCOVERY_SERVICES_PK,
                            sk: "".concat(DISCOVERY_SERVICES_SK_PREFIX).concat(sk),
                        },
                    };
                    console.log(params);
                    return [4 /*yield*/, ddbDocClient.send(new GetCommand(params))];
                case 2:
                    serviceData = _a.sent();
                    console.log(serviceData);
                    subsegment.close();
                    return [2 /*return*/, serviceData];
                case 3:
                    error_3 = _a.sent();
                    console.log(error_3);
                    subsegment.close();
                    return [2 /*return*/, { error: error_3, message: error_3["__type"].split("#")[1] }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
