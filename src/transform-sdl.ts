import {
  DirectiveNode,
  FieldDefinitionNode,
  ObjectTypeDefinitionNode,
  ObjectTypeExtensionNode,
  parse,
  print,
  visit,
} from 'graphql/language';
import { createDirectiveNode, createStringValueNode } from './ast-builders';
import { GraphQLReferenceResolver } from '@apollo/federation/dist/types';

function createExternalDirectiveNode() {
  return createDirectiveNode('external');
}

function createKeyDirectiveNode(fields: string): DirectiveNode {
  return createDirectiveNode('key', {
    fields: createStringValueNode(fields),
  });
}

export interface FederationConfig<TContext> {
  [typeName: string]: {
    keyFields?: string[];
    extend?: boolean;
    external?: string[];
    resolveReference?: GraphQLReferenceResolver<TContext>;
  };
}

export function addFederationAnnotations<TContext>(
  schema: string,
  config: FederationConfig<TContext>,
): string {
  const ast = parse(schema);

  const objectTypesTodo = new Set(
    Object.entries(config)
      .filter(
        ([, config]) =>
          (config.keyFields && config.keyFields.length) || config.extend,
      )
      .map(([typeName]) => typeName),
  );

  const externalFieldsToDo = Object.fromEntries(
    Object.entries(config)
      .filter(([typeName, config]) => !!config.external)
      .map(([typeName, config]) => [typeName, new Set(config.external)]),
  );

  let currentTypeName: string | undefined = undefined;

  const withDirectives = visit(ast, {
    ObjectTypeDefinition: {
      enter(
        node: ObjectTypeDefinitionNode,
      ): ObjectTypeDefinitionNode | ObjectTypeExtensionNode | undefined {
        currentTypeName = node.name.value;
        if (objectTypesTodo.has(currentTypeName)) {
          objectTypesTodo.delete(currentTypeName);

          const { keyFields, extend } = config[currentTypeName];

          const newDirectives = keyFields
            ? keyFields.map(keyField => createKeyDirectiveNode(keyField))
            : [];

          return {
            ...node,
            directives: [...(node.directives || []), ...newDirectives],
            kind: extend ? 'ObjectTypeExtension' : node.kind,
          };
        }
      },
      leave() {
        currentTypeName = undefined;
      },
    },
    FieldDefinition(node): FieldDefinitionNode | undefined {
      if (currentTypeName && externalFieldsToDo[currentTypeName]) {
        const currentExternalFieldsToDo = externalFieldsToDo[currentTypeName];
        if (currentExternalFieldsToDo.has(node.name.value)) {
          currentExternalFieldsToDo.delete(node.name.value);
          if (currentExternalFieldsToDo.size === 0) {
            delete externalFieldsToDo[currentTypeName];
          }

          return {
            ...node,
            directives: [
              ...(node.directives || []),
              createExternalDirectiveNode(),
            ],
          };
        }
      }
      return undefined;
    },
  });

  if (objectTypesTodo.size !== 0) {
    throw new Error(
      `Could not add key directives or extend types: ${Array.from(
        objectTypesTodo,
      ).join(', ')}`,
    );
  }

  if (Object.keys(externalFieldsToDo).length !== 0) {
    throw new Error(
      `Could not mark these fields as external: ${Object.entries(
        externalFieldsToDo,
      )
        .flatMap(([typeName, externalFields]) => {
          return Array.from(externalFields).map(
            externalField => `${typeName}.${externalField}`,
          );
        })
        .join(', ')}`,
    );
  }

  return print(withDirectives);
}
