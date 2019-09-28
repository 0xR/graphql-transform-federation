import {
  FieldDefinitionNode,
  ObjectTypeDefinitionNode,
  ObjectTypeExtensionNode,
  parse,
  print,
  visit,
} from 'graphql/language';
import { createDirectiveNode, createStringValueNode } from './ast-builders';
import {
  FederationConfig,
  FederationFieldConfig,
  FederationFieldsConfig,
  FederationObjectConfig,
} from './transform-federation';

function createDirectiveWithFields(directiveName: string, fields: string) {
  return createDirectiveNode(directiveName, {
    fields: createStringValueNode(fields),
  });
}

function isFieldConfigToDo({
  external,
  provides,
}: FederationFieldConfig): boolean {
  return Boolean(external || provides);
}

function filterFieldsConfigToDo(
  fieldsConfig: FederationFieldsConfig,
): FederationFieldsConfig {
  return Object.fromEntries(
    Object.entries(fieldsConfig).filter(([typeName, fieldConfig]) =>
      isFieldConfigToDo(fieldConfig),
    ),
  );
}

function isObjectConfigToDo<TContext>({
  extend,
  keyFields,
}: FederationObjectConfig<TContext>): boolean {
  return Boolean((keyFields && keyFields.length) || extend);
}

export function addFederationAnnotations<TContext>(
  schema: string,
  federationConfig: FederationConfig<TContext>,
): string {
  const ast = parse(schema);

  const objectTypesTodo = new Set(
    Object.entries(federationConfig)
      .filter(([, config]) => isObjectConfigToDo<TContext>(config))
      .map(([typeName]) => typeName),
  );

  const fieldTypesTodo: {
    [objectTypeName: string]: FederationFieldsConfig;
  } = Object.fromEntries(
    Object.entries(federationConfig)
      .flatMap(([typeName, { fields }]) =>
        fields ? [[typeName, filterFieldsConfigToDo(fields)]] : [],
      )
      .filter(([typeName, fieldsConfig]) => Object.keys(fieldsConfig).length),
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

          const { keyFields, extend } = federationConfig[currentTypeName];

          const newDirectives = keyFields
            ? keyFields.map(keyField =>
                createDirectiveWithFields('key', keyField),
              )
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
      const currentFieldsTodo =
        currentTypeName && fieldTypesTodo[currentTypeName];
      if (
        currentTypeName &&
        currentFieldsTodo &&
        currentFieldsTodo[node.name.value]
      ) {
        const currentFieldConfig = currentFieldsTodo[node.name.value];
        delete currentFieldsTodo[node.name.value];
        if (Object.keys(currentFieldsTodo).length === 0) {
          delete fieldTypesTodo[currentTypeName];
        }

        return {
          ...node,
          directives: [
            ...(node.directives || []),
            ...(currentFieldConfig.external
              ? [createDirectiveNode('external')]
              : []),
            ...(currentFieldConfig.provides
              ? [
                  createDirectiveWithFields(
                    'provides',
                    currentFieldConfig.provides,
                  ),
                ]
              : []),
          ],
        };
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

  if (Object.keys(fieldTypesTodo).length !== 0) {
    throw new Error(
      `Could not add directive to these fields: ${Object.entries(fieldTypesTodo)
        .flatMap(([typeName, fieldsConfig]) => {
          return Object.keys(fieldsConfig).map(
            externalField => `${typeName}.${externalField}`,
          );
        })
        .join(', ')}`,
    );
  }

  return print(withDirectives);
}
