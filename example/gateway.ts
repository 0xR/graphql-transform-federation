import { ServerInfo } from 'apollo-server';

const { ApolloServer } = require('apollo-server');
const { ApolloGateway } = require('@apollo/gateway');

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'transformed', url: 'http://localhost:4001/graphql' },
    { name: 'extension', url: 'http://localhost:4002/graphql' },
  ],
});

(async () => {
  const { schema, executor } = await gateway.load();

  const server = new ApolloServer({ schema, executor });

  server.listen().then(({ url }: ServerInfo) => {
    console.log(`🚀 Gateway ready at ${url}`);
  });
})();
