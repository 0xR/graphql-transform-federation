import { GraphQLSchema } from 'graphql';
import { GraphQLReferenceResolver } from '@apollo/federation/dist/types';
export interface FederationFieldConfig {
    external?: boolean;
    provides?: string;
    requires?: string;
}
export interface FederationFieldsConfig {
    [fieldName: string]: FederationFieldConfig;
}
export interface FederationObjectConfig<TContext> {
    keyFields?: string[];
    extend?: boolean;
    resolveReference?: GraphQLReferenceResolver<TContext>;
    fields?: FederationFieldsConfig;
}
export interface FederationConfig<TContext> {
    [objectName: string]: FederationObjectConfig<TContext>;
}
export declare function transformSchemaFederation<TContext>(schema: GraphQLSchema, federationConfig: FederationConfig<TContext>): GraphQLSchema;
