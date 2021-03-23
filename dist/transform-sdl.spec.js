"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dedent_1 = __importDefault(require("dedent"));
var transform_sdl_1 = require("./transform-sdl");
describe('transform-sdl', function () {
    it('should add key directives to sdl', function () {
        expect(transform_sdl_1.addFederationAnnotations("\n      type Product @keep {\n        id: Int\n      }", {
            Product: {
                keyFields: ['id'],
            },
        })).toEqual(dedent_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      type Product @keep @key(fields: \"id\") {\n        id: Int\n      }\n"], ["\n      type Product @keep @key(fields: \"id\") {\n        id: Int\n      }\\n"]))));
    });
    it('should throw an error if not all keys were added', function () {
        expect(function () {
            transform_sdl_1.addFederationAnnotations("\n        type Product {\n          id: Int\n        }\n      ", {
                NotProduct: {
                    keyFields: ['mock keyFields'],
                },
                NotProduct2: {
                    keyFields: ['mock keyFields'],
                },
            });
        }).toThrow('Could not add key directives or extend types: NotProduct, NotProduct2');
    });
    it('should convert types to extend types', function () {
        expect(transform_sdl_1.addFederationAnnotations("\n      type Product {\n        id: Int\n      }", {
            Product: {
                extend: true,
            },
        })).toEqual(dedent_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      extend type Product {\n        id: Int\n      }\n"], ["\n      extend type Product {\n        id: Int\n      }\\n"]))));
    });
    it('should add directive to fields', function () {
        expect(transform_sdl_1.addFederationAnnotations("\n      type Product {\n        id: Int\n      }", {
            Product: {
                fields: {
                    id: {
                        external: true,
                        provides: 'mock provides',
                        requires: 'a { query }',
                    },
                },
            },
        })).toEqual(dedent_1.default(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      type Product {\n        id: Int @external @provides(fields: \"mock provides\") @requires(fields: \"a { query }\")\n      }\n"], ["\n      type Product {\n        id: Int @external @provides(fields: \"mock provides\") @requires(fields: \"a { query }\")\n      }\\n"]))));
    });
    it('should throw an error if not all external fields could get a directive', function () {
        expect(function () {
            transform_sdl_1.addFederationAnnotations("\n        type Product {\n          id: Int\n        }\n      ", {
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
            });
        }).toThrow('Could not add directive to these fields: NotProduct.field1, NotProduct.field2, NotProduct.field3');
    });
});
var templateObject_1, templateObject_2, templateObject_3;
//# sourceMappingURL=transform-sdl.spec.js.map