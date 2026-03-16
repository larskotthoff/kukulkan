"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const results_1 = require("../../../results");
const AbstractParserWithWordBoundary_1 = require("../../../common/parsers/AbstractParserWithWordBoundary");
const PATTERN = `(?:(?:приблизно|орієнтовно)\\s*(?:~\\s*)?)?(${constants_1.TIME_UNITS_PATTERN})${constants_1.REGEX_PARTS.rightBoundary}`;
class UKTimeUnitWithinFormatParser extends AbstractParserWithWordBoundary_1.AbstractParserWithWordBoundaryChecking {
    patternLeftBoundary() {
        return constants_1.REGEX_PARTS.leftBoundary;
    }
    innerPattern(context) {
        return context.option.forwardDate
            ? new RegExp(PATTERN, "i")
            : new RegExp(`(?:протягом|на протязі|протягом|упродовж|впродовж)\\s*${PATTERN}`, constants_1.REGEX_PARTS.flags);
    }
    innerExtract(context, match) {
        const timeUnits = (0, constants_1.parseTimeUnits)(match[1]);
        return results_1.ParsingComponents.createRelativeFromReference(context.reference, timeUnits);
    }
}
exports.default = UKTimeUnitWithinFormatParser;
//# sourceMappingURL=UKTimeUnitWithinFormatParser.js.map