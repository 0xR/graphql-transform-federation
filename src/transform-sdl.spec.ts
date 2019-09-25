import dedent from 'dedent';
import { addFederationAnnotations } from './transform-sdl';

describe('transform-federation', () => {
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

  it('should mark fields as external', () => {
    expect(
      addFederationAnnotations(
        `
      type Product {
        id: Int
      }`,
        {
          Product: {
            external: ['id'],
          },
        },
      ),
    ).toEqual(dedent`
      type Product {
        id: Int @external
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
            external: ['field1', 'field2'],
          },
        },
      );
    }).toThrow(
      'Could not mark these fields as external: NotProduct.field1, NotProduct.field2',
    );
  });
});
