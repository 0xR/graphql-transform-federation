import { mergeSchemas } from 'graphql-tools';
import { transformSchema } from 'apollo-graphql';
import {
  GraphQLObjectType,
  GraphQLSchema,
  printSchema,
  isObjectType,
  isUnionType,
  GraphQLUnionType,
} from 'graphql';
import { addFederationAnnotations, FederationConfig } from './transform-sdl';
import {
  entitiesField,
  EntityType,
  serviceField,
} from '@apollo/federation/dist/types';

export function addFederationFields<TContext>(
  schema: GraphQLSchema,
  federationConfig: FederationConfig<TContext>,
): GraphQLSchema {
  const schemaWithFederationDirectives = addFederationAnnotations(
    printSchema(schema),
    federationConfig,
  );

  const schemaWithQueryType = !schema.getQueryType()
    ? new GraphQLSchema({
        ...schema.toConfig(),
        query: new GraphQLObjectType({
          name: 'Query',
          fields: {},
        }),
      })
    : schema;

  const entityTypes = Object.fromEntries(
    Object.entries(federationConfig)
      .filter(
        ([, { keyFields, extend }]) =>
          keyFields && keyFields.length && !!extend,
      )
      .map(([typeName]) => [typeName, schemaWithQueryType.getType(typeName)]),
  );

  const hasEntities = !!Object.keys(entityTypes).length;

  const schemaWithFederationQueryType = transformSchema(
    schemaWithQueryType,
    type => {
      // Add `_entities` and `_service` fields to query root type
      if (isObjectType(type) && type === schemaWithQueryType.getQueryType()) {
        const config = type.toConfig();
        return new GraphQLObjectType({
          ...config,
          fields: {
            ...config.fields,
            ...(hasEntities && { _entities: entitiesField }),
            _service: {
              ...serviceField,
              resolve: () => ({ sdl: schemaWithFederationDirectives }),
            },
          },
        });
      }
      return undefined;
    },
  );

  const schemaWithUnionType = transformSchema(
    schemaWithFederationQueryType,
    type => {
      if (hasEntities && isUnionType(type) && type.name === EntityType.name) {
        return new GraphQLUnionType({
          ...EntityType.toConfig(),
          types: Object.values(entityTypes).filter(isObjectType),
        });
      }
      return undefined;
    },
  );

  // Not using transformSchema since it will remove resolveReference
  Object.entries(federationConfig).forEach(
    ([typeName, currentFederationConfig]) => {
      if (currentFederationConfig.resolveReference) {
        const type = schemaWithUnionType.getType(typeName);
        if (isObjectType(type)) {
          type.resolveReference = currentFederationConfig.resolveReference;
        }
      }
    },
  );
  return schemaWithUnionType;
}
