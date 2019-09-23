import { DirectiveNode, parse, print, visit } from 'graphql/language';

function createKeyDirectiveNode(fields: string): DirectiveNode {
  return {
    kind: 'Directive',
    name: {
      kind: 'Name',
      value: 'key',
    },
    arguments: [
      {
        kind: 'Argument',
        name: {
          kind: 'Name',
          value: 'fields',
        },
        value: {
          kind: 'StringValue',
          value: fields,
        },
      },
    ],
  };
}

export interface KeyDirectiveConfig {
  [typeName: string]: {
    keyFields: string[];
  };
}

export function addKeyDirective(
  schema: string,
  config: KeyDirectiveConfig,
): string {
  const ast = parse(schema);

  const typesTodo = new Set(Object.keys(config));

  const withDirectives = visit(ast, {
    ObjectTypeDefinition: {
      enter(node) {
        const typeName = node.name.value;
        if (typesTodo.has(typeName)) {
          typesTodo.delete(typeName);

          const newDirectives = config[typeName].keyFields.map(keyField =>
            createKeyDirectiveNode(keyField),
          );
          return {
            ...node,
            directives: [
              ...(node.directives || []),
              ...newDirectives
            ],
          };
        }
      },
    },
  });

  if(typesTodo.size !== 0) {
    throw new Error(`Could not add key directives to types: ${Array.from(typesTodo).join(', ')}`)
  }
  return print(withDirectives);
}
