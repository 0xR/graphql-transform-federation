"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDirectiveNode = exports.createStringValueNode = exports.createNameNode = void 0;
function createNameNode(value) {
    return {
        kind: 'Name',
        value: value,
    };
}
exports.createNameNode = createNameNode;
function createStringValueNode(value, block) {
    if (block === void 0) { block = false; }
    return {
        kind: 'StringValue',
        value: value,
        block: block,
    };
}
exports.createStringValueNode = createStringValueNode;
function createDirectiveNode(name, directiveArguments) {
    if (directiveArguments === void 0) { directiveArguments = {}; }
    return {
        kind: 'Directive',
        name: createNameNode(name),
        arguments: Object.entries(directiveArguments).map(function (_a) {
            var argumentName = _a[0], value = _a[1];
            return ({
                kind: 'Argument',
                name: createNameNode(argumentName),
                value: value,
            });
        }),
    };
}
exports.createDirectiveNode = createDirectiveNode;
//# sourceMappingURL=ast-builders.js.map