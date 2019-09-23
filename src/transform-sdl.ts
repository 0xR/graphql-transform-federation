import { DirectiveNode, parse, print, visit } from 'graphql/language';

export function addKeyDirective(schema: string): string {
  const ast = parse(schema);

  const directive: DirectiveNode = {
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
          value: 'id',
        },
      },
    ],
  };
  const withDirectives = visit(ast, {
    ObjectTypeDefinition: {
      enter(node) {
        return {
          ...node,
          directives: [...(node.directives || []), directive],
        };
      },
    },
  });
  return print(withDirectives);
}
