# graphql-transform-federation

If you want to use
[GraphQL federation](https://www.apollographql.com/docs/apollo-server/federation/introduction/),
but you can't rebuild your current GraphQL schema, you can use this transform to
add GraphQL federation functionality to an existing schema. You need this when
you are using a managed GraphQL service or a generated schema which doesn't
support federation (yet).

If you are using apollo-server or another schema builder that supports
federation you don't need this transform you should
[add the federation directives](https://www.apollographql.com/docs/apollo-server/federation/implementing/)
directly.

This transform will add the resolvers and directives to conform to the
[federation specification](https://www.apollographql.com/docs/apollo-server/federation/federation-spec/#federation-schema-specification).
Much of the
[federation sourcecode](https://github.com/apollographql/apollo-server/tree/master/packages/apollo-federation)
could be reused ensuring it is compliant to the specification.

Check out the
[blogpost introducing graphql-tranform-federation](https://xebia.com/blog/graphql-federation-for-everyone/)
for more background information.

![Architecture diagram for graphql-transform-federation](https://docs.google.com/drawings/d/e/2PACX-1vQkWQKeH9OClskaHoV0XPoVGl-w1_MEFGkhuRW03KG0R3SHXJXv9E4pOF4IR0EnoubS1vn1a_33UAnb/pub?w=990&h=956 'Architecture using a remote schema')

## Usage

You can use this transform on a local or a remote GraphQL schema. When using a
remote schema your service acts a middleware layer as shown in the diagram
above. Check the
[remote schema documentation](https://www.apollographql.com/docs/graphql-tools/remote-schemas/)
for how to get an executable schema that you can use with this transform.

The example below shows a configuration where the transformed schema extends an
existing schema. It already had a resolver `productById` which is used to relate
products between the two schemas. This example can be started using
[npm run example](#npm-run-example).

```typescript
import { transformSchemaFederation } from 'graphql-transform-federation';
import { delegateToSchema } from 'graphql-tools';

const schemaWithoutFederation = // your existing executable schema

const federationSchema = transformSchemaFederation(schemaWithoutFederation, {
  Query: {
    // Ensure the root queries of this schema show up the combined schema
    extend: true,
  },
  Product: {
    // extend Product {
    extend: true,
    // Product @key(fields: "id") {
    keyFields: ['id'],
    fields: {
      // id: Int! @external
      id: {
        external: true
      }
    },
    resolveReference({ id }, context, info) {
      return delegateToSchema({
        schema: info.schema,
        operation: 'query',
        fieldName: 'productById',
        args: {
          id,
        },
        context,
        info,
      });
    },
  },
});
```

To allow objects of an existing schema to be extended by other schemas it only
needs to get `@key(...)` directives.

```typescript
const federationSchema = transformSchemaFederation(schemaWithoutFederation, {
  Product: {
    // Product @key(fields: "id") {
    keyFields: ['id'],
  },
});
```

## API reference

```typescript
import { GraphQLSchema } from 'graphql';
import { GraphQLReferenceResolver } from '@apollo/federation/dist/types';

interface FederationFieldConfig {
  external?: boolean;
  provides?: string;
  requires?: string;
}

interface FederationFieldsConfig {
  [fieldName: string]: FederationFieldConfig;
}

interface FederationObjectConfig<TContext> {
  // An array so you can add multiple @key(...) directives
  keyFields?: string[];
  extend?: boolean;
  resolveReference?: GraphQLReferenceResolver<TContext>;
  fields?: FederationFieldsConfig;
}

interface FederationConfig<TContext> {
  [objectName: string]: FederationObjectConfig<TContext>;
}

function transformSchemaFederation<TContext>(
  schema: GraphQLSchema,
  federationConfig: FederationConfig<TContext>,
): GraphQLSchema;
```

## `npm run example`

Runs 2 GraphQL servers and a federation gateway to combine both schemas.
[Transformed-server](./example/transformed-server.ts) is a regular GraphQL
schema that is tranformed using this library. The
[federation-server](example/federation-server.ts) is a federation server which
is extended by a type defined by the `transformed-server`. The
[gateway](./example/gateway.ts) combines both schemas using the apollo gateway.

## `npm run example:watch`

Runs the example in watch mode for development.

## `npm run test`

Run the tests
