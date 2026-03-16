import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
import { REGEX_PARTS } from "../constants.js";
export class AbstractParserWithLeftBoundaryChecking extends AbstractParserWithWordBoundaryChecking {
    patternLeftBoundary() {
        return REGEX_PARTS.leftBoundary;
    }
    innerPattern(context) {
        return new RegExp(this.innerPatternString(context), REGEX_PARTS.flags);
    }
    innerPatternHasChange(context, currentInnerPattern) {
        return false;
    }
}
export class AbstractParserWithLeftRightBoundaryChecking extends AbstractParserWithLeftBoundaryChecking {
    innerPattern(context) {
        return new RegExp(`${this.innerPatternString(context)}${REGEX_PARTS.rightBoundary}`, REGEX_PARTS.flags);
    }
}
//# sourceMappingURL=AbstractParserWithWordBoundaryChecking.js.map