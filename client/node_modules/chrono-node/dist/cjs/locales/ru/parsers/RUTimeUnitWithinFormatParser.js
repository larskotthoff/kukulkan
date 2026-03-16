"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const results_1 = require("../../../results");
const AbstractParserWithWordBoundary_1 = require("../../../common/parsers/AbstractParserWithWordBoundary");
const PATTERN = `(?:(?:около|примерно)\\s*(?:~\\s*)?)?(${constants_1.TIME_UNITS_PATTERN})${constants_1.REGEX_PARTS.rightBoundary}`;
class RUTimeUnitWithinFormatParser extends AbstractParserWithWordBoundary_1.AbstractParserWithWordBoundaryChecking {
    patternLeftBoundary() {
        return constants_1.REGEX_PARTS.leftBoundary;
    }
    innerPattern(context) {
        return context.option.forwardDate
            ? new RegExp(PATTERN, constants_1.REGEX_PARTS.flags)
            : new RegExp(`(?:в течение|в течении)\\s*${PATTERN}`, constants_1.REGEX_PARTS.flags);
    }
    innerExtract(context, match) {
        const timeUnits = (0, constants_1.parseTimeUnits)(match[1]);
        return results_1.ParsingComponents.createRelativeFromReference(context.reference, timeUnits);
    }
}
exports.default = RUTimeUnitWithinFormatParser;
//# sourceMappingURL=RUTimeUnitWithinFormatParser.js.map