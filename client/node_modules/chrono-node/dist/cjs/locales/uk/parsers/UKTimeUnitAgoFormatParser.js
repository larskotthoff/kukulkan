"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const results_1 = require("../../../results");
const timeunits_1 = require("../../../utils/timeunits");
const AbstractParserWithWordBoundaryChecking_1 = require("./AbstractParserWithWordBoundaryChecking");
class UKTimeUnitAgoFormatParser extends AbstractParserWithWordBoundaryChecking_1.AbstractParserWithLeftBoundaryChecking {
    innerPatternString(context) {
        return `(${constants_1.TIME_UNITS_PATTERN})\\s{0,5}тому(?=(?:\\W|$))`;
    }
    innerExtract(context, match) {
        const timeUnits = (0, constants_1.parseTimeUnits)(match[1]);
        const outputTimeUnits = (0, timeunits_1.reverseTimeUnits)(timeUnits);
        return results_1.ParsingComponents.createRelativeFromReference(context.reference, outputTimeUnits);
    }
}
exports.default = UKTimeUnitAgoFormatParser;
//# sourceMappingURL=UKTimeUnitAgoFormatParser.js.map