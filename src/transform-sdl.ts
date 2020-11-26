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
  requires,
}: FederationFieldConfig): boolean {
  return Boolean(external || provides || requires);
}

function filterFieldsConfigToDo(
  fieldsConfig: FederationFieldsConfig,
): FederationFieldsConfig {
  return Object.fromEntries(
    Object.entries(fieldsConfig).filter(([, fieldConfig]) =>
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
      .map(([objectName]) => objectName),
  );

  const fieldTypesTodo: {
    [objectName: string]: FederationFieldsConfig;
  } = Object.fromEntries(
    Object.entries(federationConfig)
      .flatMap(([objectName, { fields }]) =>
        fields ? [[objectName, filterFieldsConfigToDo(fields)]] : [],
      )
      .filter(([, fieldsConfig]) => Object.keys(fieldsConfig).length),
  );

  let currentObjectName: string | undefined = undefined;

  const withDirectives = visit(ast, {
    ObjectTypeDefinition: {
      enter(
        node: ObjectTypeDefinitionNode,
      ): ObjectTypeDefinitionNode | ObjectTypeExtensionNode | undefined {
        currentObjectName = node.name.value;
        if (objectTypesTodo.has(currentObjectName)) {
          objectTypesTodo.delete(currentObjectName);

          const { keyFields, extend } = federationConfig[currentObjectName];

          const newDirectives = keyFields
            ? keyFields.map((keyField) =>
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
        currentObjectName = undefined;
      },
    },
    FieldDefinition(node): FieldDefinitionNode | undefined {
      const currentFieldsTodo =
        currentObjectName && fieldTypesTodo[currentObjectName];
      if (
        currentObjectName &&
        currentFieldsTodo &&
        currentFieldsTodo[node.name.value]
      ) {
        const currentFieldConfig = currentFieldsTodo[node.name.value];
        delete currentFieldsTodo[node.name.value];
        if (Object.keys(currentFieldsTodo).length === 0) {
          delete fieldTypesTodo[currentObjectName];
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
            ...(currentFieldConfig.requires
              ? [
                  createDirectiveWithFields(
                    'requires',
                    currentFieldConfig.requires,
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
        .flatMap(([objectName, fieldsConfig]) => {
          return Object.keys(fieldsConfig).map(
            (externalField) => `${objectName}.${externalField}`,
          );
        })
        .join(', ')}`,
    );
  }

  return print(withDirectives);
}
