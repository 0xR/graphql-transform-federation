import dedent from 'dedent';
import { addFederationAnnotations } from './transform-sdl';

describe('transform-sdl', () => {
  it('should add key directives to sdl', () => {
    expect(
      addFederationAnnotations(
        `
      type Product @keep {
        id: Int
      }`,
        {
          Product: {
            keyFields: ['id'],
          },
        },
      ),
    ).toEqual(dedent`
      type Product @keep @key(fields: "id") {
        id: Int
      }\n`);
  });

  it('should throw an error if not all keys were added', () => {
    expect(() => {
      addFederationAnnotations(
        `
        type Product {
          id: Int
        }
      `,
        {
          NotProduct: {
            keyFields: ['mock keyFields'],
          },
          NotProduct2: {
            keyFields: ['mock keyFields'],
          },
        },
      );
    }).toThrow(
      'Could not add key directives or extend types: NotProduct, NotProduct2',
    );
  });

  it('should convert types to extend types', () => {
    expect(
      addFederationAnnotations(
        `
      type Product {
        id: Int
      }`,
        {
          Product: {
            extend: true,
          },
        },
      ),
    ).toEqual(dedent`
      extend type Product {
        id: Int
      }\n`);
  });

  it('should add directive to fields', () => {
    expect(
      addFederationAnnotations(
        `
      type Product {
        id: Int
      }`,
        {
          Product: {
            fields: {
              id: {
                external: true,
                provides: 'mock provides',
                requires: 'a { query }',
              },
            },
          },
        },
      ),
    ).toEqual(dedent`
      type Product {
        id: Int @external @provides(fields: "mock provides") @requires(fields: "a { query }")
      }\n`);
  });

  it('should throw an error if not all external fields could get a directive', () => {
    expect(() => {
      addFederationAnnotations(
        `
        type Product {
          id: Int
        }
      `,
        {
          NotProduct: {
            fields: {
              field1: {
                external: true,
              },
              field2: {
                provides: 'mock provides',
              },
              field3: {
                requires: 'mock requires',
              },
            },
          },
        },
      );
    }).toThrow(
      'Could not add directive to these fields: NotProduct.field1, NotProduct.field2, NotProduct.field3',
    );
  });
});
