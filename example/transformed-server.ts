import {
  ApolloServer,
  delegateToSchema,
  makeExecutableSchema,
} from 'apollo-server';
import { addFederationFields } from '../src/transform-federation';

const products = [
  {
    id: '123',
    name: 'name from transformed service',
  },
];

interface ProductKey {
  id: string;
}

const schemaWithoutFederation = makeExecutableSchema({
  typeDefs: `
    type Product {
      id: String!
      name: String!
    }
    
    type Query {
      productById(id: String!): Product!
    }
  `,
  resolvers: {
    Query: {
      productById(source, { id }: ProductKey) {
        return products.find(product => product.id === id);
      },
    },
  },
});

const federationSchema = addFederationFields(schemaWithoutFederation, {
  Query: {
    extend: true,
  },
  Product: {
    extend: true,
    keyFields: ['id'],
    external: ['id'],
    resolveReference(reference, context: { [key: string]: any }, info) {
      return delegateToSchema({
        schema: info.schema,
        operation: 'query',
        fieldName: 'productById',
        args: {
          id: (reference as ProductKey).id,
        },
        context,
        info,
      });
    },
  },
});

new ApolloServer({
  schema: federationSchema,
})
  .listen({
    port: 4001,
  })
  .then(({ url }) => {
    console.log(`🚀 Transformed server ready at ${url}`);
  });
