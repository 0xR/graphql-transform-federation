import { makeExecutableSchema } from 'graphql-tools';
import { transformSchemaFederation } from './transform-federation';
import { execute } from 'graphql/execution/execute';
import { parse } from 'graphql/language';
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

    const federationSchema = transformSchemaFederation(executableSchema, {
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
  it('should resolve references', async () => {
    const executableSchema = makeExecutableSchema({
      typeDefs: `
    type Product {
      id: ID!
      name: String!
    }
      `,
      resolvers: {},
    });

    const federationSchema = transformSchemaFederation(executableSchema, {
      Product: {
        keyFields: ['id'],
        extend: true,
        resolveReference(reference) {
          return {
            ...reference,
            name: 'mock name',
          };
        },
      },
    });

    expect(
      await execute({
        schema: federationSchema,
        document: parse(`
          query{
            _entities (representations: {
              __typename:"Product"
              id: "1"
            }) {
              __typename
              ...on Product {
                id
                name
              }
            }
          } 
        `),
      }),
    ).toEqual({
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
  });

  it('should throw and error when adding resolveReference on a scalar', () => {
    const executableSchema = makeExecutableSchema({
      typeDefs: 'scalar MockScalar',
      resolvers: {},
    });

    expect(() =>
      transformSchemaFederation(executableSchema, {
        MockScalar: {
          resolveReference() {
            return {};
          },
        },
      }),
    ).toThrow(
      'Type "MockScalar" is not an object type and can\'t have a resolveReference function',
    );
  });
});
