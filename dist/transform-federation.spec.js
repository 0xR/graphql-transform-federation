"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
        while (_) try {
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
var graphql_tools_1 = require("graphql-tools");
var transform_federation_1 = require("./transform-federation");
var execute_1 = require("graphql/execution/execute");
var language_1 = require("graphql/language");
var dedent = require("dedent");
describe('Transform Federation', function () {
    it('should add a _service field', function () { return __awaiter(void 0, void 0, void 0, function () {
        var executableSchema, federationSchema, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    executableSchema = graphql_tools_1.makeExecutableSchema({
                        typeDefs: "\n        type Product {\n          id: ID!\n        }\n      ",
                        resolvers: {},
                    });
                    federationSchema = transform_federation_1.transformSchemaFederation(executableSchema, {
                        Product: {
                            keyFields: ['id'],
                        },
                    });
                    _a = expect;
                    return [4 /*yield*/, execute_1.execute({
                            schema: federationSchema,
                            document: language_1.parse("\n          query {\n            _service {\n              sdl\n            }\n          }\n        "),
                        })];
                case 1:
                    _a.apply(void 0, [_b.sent()]).toEqual({
                        data: {
                            _service: {
                                sdl: dedent(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n            type Product @key(fields: \"id\") {\n              id: ID!\n            }\n\n          "], ["\n            type Product @key(fields: \"id\") {\n              id: ID!\n            }\\n\n          "]))),
                            },
                        },
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('should resolve references', function () { return __awaiter(void 0, void 0, void 0, function () {
        var executableSchema, federationSchema, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    executableSchema = graphql_tools_1.makeExecutableSchema({
                        typeDefs: "\n    type Product {\n      id: ID!\n      name: String!\n    }\n      ",
                        resolvers: {},
                    });
                    federationSchema = transform_federation_1.transformSchemaFederation(executableSchema, {
                        Product: {
                            keyFields: ['id'],
                            extend: true,
                            resolveReference: function (reference) {
                                return __assign(__assign({}, reference), { name: 'mock name' });
                            },
                        },
                    });
                    _a = expect;
                    return [4 /*yield*/, execute_1.execute({
                            schema: federationSchema,
                            document: language_1.parse("\n          query{\n            _entities (representations: {\n              __typename:\"Product\"\n              id: \"1\"\n            }) {\n              __typename\n              ...on Product {\n                id\n                name\n              }\n            }\n          } \n        "),
                        })];
                case 1:
                    _a.apply(void 0, [_b.sent()]).toEqual({
                        data: {
                            _entities: [
                                {
                                    __typename: 'Product',
                                    id: '1',
                                    name: 'mock name',
                                },
                            ],
                        },
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('should throw and error when adding resolveReference on a scalar', function () {
        var executableSchema = graphql_tools_1.makeExecutableSchema({
            typeDefs: 'scalar MockScalar',
            resolvers: {},
        });
        expect(function () {
            return transform_federation_1.transformSchemaFederation(executableSchema, {
                MockScalar: {
                    resolveReference: function () {
                        return {};
                    },
                },
            });
        }).toThrow('Type "MockScalar" is not an object type and can\'t have a resolveReference function');
    });
});
var templateObject_1;
//# sourceMappingURL=transform-federation.spec.js.map