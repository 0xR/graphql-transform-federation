import { makeExecutableSchema, mergeSchemas } from 'graphql-tools';
import { GraphQLSchema, printSchema } from 'graphql';
import { addFederationAnnotations, FederationConfig } from './transform-sdl';

export function addFederationFields(
  schema: GraphQLSchema,
  config: FederationConfig,
): GraphQLSchema {
  const schemaWithKeyDirectives = addFederationAnnotations(
    printSchema(schema),
    config,
  );

  const serviceSchema = makeExecutableSchema({
    typeDefs: `
      type _Service {
        sdl: String
      }
   
      type Query {
        _service: _Service!
      }
      `,
    resolvers: {
      Query: {
        _service() {
          return {
            sdl: schemaWithKeyDirectives,
          };
        },
      },
    },
  });

  return mergeSchemas({
    schemas: [schema, serviceSchema],
  });
}
