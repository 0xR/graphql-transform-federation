import dedent from 'dedent';
import { addKeyDirective } from "./transform-sdl";

describe('transform-federation', () => {
  it('should add key directives to sdl', () => {
    expect(
      addKeyDirective(dedent`
      type Product {
        id: Int
      }`),
    ).toEqual(dedent`
      type Product @key(fields: "id") {
        id: Int
      }\n`);
  });
});
