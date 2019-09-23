import dedent from 'dedent';
import { addKeyDirective } from './transform-sdl';

describe('transform-federation', () => {
  it('should add key directives to sdl', () => {
    expect(
      addKeyDirective(
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
      addKeyDirective(
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
      'Could not add key directives to types: NotProduct, NotProduct2',
    );
  });
});
