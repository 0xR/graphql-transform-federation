import {
  NameNode,
  StringValueNode,
  DirectiveNode,
  ValueNode,
} from 'graphql/language';

export function createNameNode(value: string): NameNode {
  return {
    kind: 'Name',
    value,
  };
}

export function createStringValueNode(
  value: string,
  block = false,
): StringValueNode {
  return {
    kind: 'StringValue',
    value,
    block,
  };
}

export function createDirectiveNode(
  name: string,
  directiveArguments: { [argumentName: string]: ValueNode } = {},
): DirectiveNode {
  return {
    kind: 'Directive',
    name: createNameNode(name),
    arguments: Object.entries(directiveArguments).map(
      ([argumentName, value]) => ({
        kind: 'Argument',
        name: createNameNode(argumentName),
        value,
      }),
    ),
  };
}
