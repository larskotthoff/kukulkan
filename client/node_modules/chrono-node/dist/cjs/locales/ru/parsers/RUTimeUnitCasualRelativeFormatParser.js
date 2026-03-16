"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const results_1 = require("../../../results");
const timeunits_1 = require("../../../utils/timeunits");
const AbstractParserWithWordBoundaryChecking_1 = require("./AbstractParserWithWordBoundaryChecking");
class RUTimeUnitCasualRelativeFormatParser extends AbstractParserWithWordBoundaryChecking_1.AbstractParserWithLeftRightBoundaryChecking {
    innerPatternString(context) {
        return `(эти|последние|прошлые|следующие|после|спустя|через|\\+|-)\\s*(${constants_1.TIME_UNITS_PATTERN})`;
    }
    innerExtract(context, match) {
        const prefix = match[1].toLowerCase();
        let timeUnits = (0, constants_1.parseTimeUnits)(match[2]);
        switch (prefix) {
            case "последние":
            case "прошлые":
            case "-":
                timeUnits = (0, timeunits_1.reverseTimeUnits)(timeUnits);
                break;
        }
        return results_1.ParsingComponents.createRelativeFromReference(context.reference, timeUnits);
    }
}
exports.default = RUTimeUnitCasualRelativeFormatParser;
//# sourceMappingURL=RUTimeUnitCasualRelativeFormatParser.js.map