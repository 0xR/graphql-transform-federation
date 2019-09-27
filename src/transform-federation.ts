import { transformSchema } from 'apollo-graphql';
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLUnionType,
  isObjectType,
  isUnionType,
  printSchema,
} from 'graphql';
import { addFederationAnnotations } from './transform-sdl';
import {
  entitiesField,
  EntityType,
  GraphQLReferenceResolver,
  serviceField,
} from '@apollo/federation/dist/types';

export interface FederationConfig<TContext> {
  [typeName: string]: {
    keyFields?: string[];
    extend?: boolean;
    external?: string[];
    resolveReference?: GraphQLReferenceResolver<TContext>;
  };
}

export function transformSchemaFederation<TContext>(
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
      .filter(([, { keyFields }]) => keyFields && keyFields.length)
      .map(([typeName]) => {
        const type = schemaWithQueryType.getType(typeName);
        if (!isObjectType(type)) {
          throw new Error(
            `Type "${typeName}" is not an object type and can't have a key directive`,
          );
        }
        return [typeName, type];
      }),
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
      if (isUnionType(type) && type.name === EntityType.name) {
        return new GraphQLUnionType({
          ...EntityType.toConfig(),
          types: Object.values(entityTypes),
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
        if (!isObjectType(type)) {
          throw new Error(
            `Type "${typeName}" is not an object type and can't have a resolveReference function`,
          );
        }
        type.resolveReference = currentFederationConfig.resolveReference;
      }
    },
  );
  return schemaWithUnionType;
}
