import { NameNode, StringValueNode, DirectiveNode, ValueNode } from 'graphql/language';
export declare function createNameNode(value: string): NameNode;
export declare function createStringValueNode(value: string, block?: boolean): StringValueNode;
export declare function createDirectiveNode(name: string, directiveArguments?: {
    [argumentName: string]: ValueNode;
}): DirectiveNode;
