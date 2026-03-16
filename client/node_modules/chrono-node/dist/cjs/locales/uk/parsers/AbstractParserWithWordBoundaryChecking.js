"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractParserWithLeftRightBoundaryChecking = exports.AbstractParserWithLeftBoundaryChecking = void 0;
const AbstractParserWithWordBoundary_1 = require("../../../common/parsers/AbstractParserWithWordBoundary");
const constants_1 = require("../constants");
class AbstractParserWithLeftBoundaryChecking extends AbstractParserWithWordBoundary_1.AbstractParserWithWordBoundaryChecking {
    patternLeftBoundary() {
        return constants_1.REGEX_PARTS.leftBoundary;
    }
    innerPattern(context) {
        return new RegExp(this.innerPatternString(context), constants_1.REGEX_PARTS.flags);
    }
    innerPatternHasChange(context, currentInnerPattern) {
        return false;
    }
}
exports.AbstractParserWithLeftBoundaryChecking = AbstractParserWithLeftBoundaryChecking;
class AbstractParserWithLeftRightBoundaryChecking extends AbstractParserWithLeftBoundaryChecking {
    innerPattern(context) {
        return new RegExp(`${this.innerPatternString(context)}${constants_1.REGEX_PARTS.rightBoundary}`, constants_1.REGEX_PARTS.flags);
    }
}
exports.AbstractParserWithLeftRightBoundaryChecking = AbstractParserWithLeftRightBoundaryChecking;
//# sourceMappingURL=AbstractParserWithWordBoundaryChecking.js.map