import { makeExecutableSchema, transformSchema } from 'graphql-tools';
import { addFederationFields } from './transform-federation';
import { execute } from 'graphql/execution/execute';
import { DirectiveNode, parse, print, visit } from 'graphql/language';
import dedent = require('dedent');

describe('Transform Federation', () => {
  it('should add a _service field', async () => {
    const executableSchema = makeExecutableSchema({
      typeDefs: `
    type Product {
      id: ID!
    }
      `,
      resolvers: {},
    });

    const federationSchema = addFederationFields(executableSchema, {
      Product: {
        keyFields: ['id'],
      },
    });

    expect(
      await execute({
        schema: federationSchema,
        document: parse(`
          query {
            _service {
              sdl
            }
          }
        `),
      }),
    ).toEqual({
      data: {
        _service: {
          sdl: dedent`
            type Product @key(fields: "id") {
              id: ID!
            }\n
          `,
        },
      },
    });
  });
});
