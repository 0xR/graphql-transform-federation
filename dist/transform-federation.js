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
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformSchemaFederation = void 0;
var apollo_graphql_1 = require("apollo-graphql");
var graphql_1 = require("graphql");
var transform_sdl_1 = require("./transform-sdl");
var types_1 = require("@apollo/federation/dist/types");
function transformSchemaFederation(schema, federationConfig) {
    var schemaWithFederationDirectives = transform_sdl_1.addFederationAnnotations(graphql_1.printSchema(schema), federationConfig);
    var schemaWithQueryType = !schema.getQueryType()
        ? new graphql_1.GraphQLSchema(__assign(__assign({}, schema.toConfig()), { query: new graphql_1.GraphQLObjectType({
                name: 'Query',
                fields: {},
            }) }))
        : schema;
    var entityTypes = Object.fromEntries(Object.entries(federationConfig)
        .filter(function (_a) {
        var keyFields = _a[1].keyFields;
        return keyFields && keyFields.length;
    })
        .filter(function (_a) {
        var objectName = _a[0];
        var type = schemaWithQueryType.getType(objectName);
        return !graphql_1.isInterfaceType(type);
    })
        .map(function (_a) {
        var objectName = _a[0];
        var type = schemaWithQueryType.getType(objectName);
        if (!graphql_1.isObjectType(type)) {
            throw new Error("Type \"" + objectName + "\" is not an object type and can't have a key directive");
        }
        return [objectName, type];
    }));
    var hasEntities = !!Object.keys(entityTypes).length;
    var schemaWithFederationQueryType = apollo_graphql_1.transformSchema(schemaWithQueryType, function (type) {
        // Add `_entities` and `_service` fields to query root type
        if (graphql_1.isObjectType(type) && type === schemaWithQueryType.getQueryType()) {
            var config = type.toConfig();
            return new graphql_1.GraphQLObjectType(__assign(__assign({}, config), { fields: __assign(__assign(__assign({}, config.fields), (hasEntities && { _entities: types_1.entitiesField })), { _service: __assign(__assign({}, types_1.serviceField), { resolve: function () { return ({ sdl: schemaWithFederationDirectives }); } }) }) }));
        }
        return undefined;
    });
    var schemaWithUnionType = apollo_graphql_1.transformSchema(schemaWithFederationQueryType, function (type) {
        if (graphql_1.isUnionType(type) && type.name === types_1.EntityType.name) {
            return new graphql_1.GraphQLUnionType(__assign(__assign({}, types_1.EntityType.toConfig()), { types: Object.values(entityTypes) }));
        }
        return undefined;
    });
    // Not using transformSchema since it will remove resolveReference
    Object.entries(federationConfig).forEach(function (_a) {
        var objectName = _a[0], currentFederationConfig = _a[1];
        if (currentFederationConfig.resolveReference) {
            var type = schemaWithUnionType.getType(objectName);
            if (!graphql_1.isObjectType(type)) {
                throw new Error("Type \"" + objectName + "\" is not an object type and can't have a resolveReference function");
            }
            type.resolveReference = currentFederationConfig.resolveReference;
        }
    });
    return schemaWithUnionType;
}
exports.transformSchemaFederation = transformSchemaFederation;
//# sourceMappingURL=transform-federation.js.map