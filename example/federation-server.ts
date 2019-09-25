import { ServerInfo } from 'apollo-server';

const { ApolloServer, gql } = require('apollo-server');
const { buildFederatedSchema } = require('@apollo/federation');

const typeDefs = gql`
  type Product @key(fields: "id") {
    id: String!
    price: Int
    weight: Int
  }

  type Query {
    findProduct: Product!
  }
`;

interface ProductKey {
  id: String;
}

const product = {
  id: '123',
  price: 899,
  weight: 100,
};

const resolvers = {
  Query: {
    findProduct() {
      return product;
    },
  },
};

const server = new ApolloServer({
  schema: buildFederatedSchema([
    {
      typeDefs,
      resolvers,
    },
  ]),
});

server.listen({ port: 4002 }).then(({ url }: ServerInfo) => {
  console.log(`🚀 Federation server ready at ${url}`);
});
