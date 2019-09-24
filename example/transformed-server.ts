import { ApolloServer, makeExecutableSchema } from 'apollo-server';
import { addFederationFields } from '../src/transform-federation';

const executableSchema = makeExecutableSchema({
  typeDefs: `
    type Product {
      id: String!
    }
    
    type Query {
      findProduct: Product!
    }
      `,
  resolvers: {
    Query: {
      findProduct() {
        return {
          id: '123',
        };
      },
    },
  },
});

const federationSchema = addFederationFields(executableSchema, {
  Product: {
    keyFields: ['id'],
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
