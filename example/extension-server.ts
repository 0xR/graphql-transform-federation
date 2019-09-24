import { ServerInfo } from 'apollo-server';

const { ApolloServer, gql } = require('apollo-server');
const { buildFederatedSchema } = require('@apollo/federation');

const typeDefs = gql`
  extend type Product @key(fields: "id") {
    id: String! @external
    name: String
    price: Int
    weight: Int
  }
`;

interface ProductKey {
  id: String;
}

const resolvers = {
  Product: {
    __resolveReference(object: ProductKey) {
      return products.find(product => product.id === object.id);
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
  console.log(`🚀 Extension server ready at ${url}`);
});

const products = [
  {
    id: '123',
    name: 'Product from extension server!',
    price: 899,
    weight: 100,
  },
];
