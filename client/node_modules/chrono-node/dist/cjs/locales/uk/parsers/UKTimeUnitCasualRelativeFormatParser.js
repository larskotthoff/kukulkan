"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const results_1 = require("../../../results");
const timeunits_1 = require("../../../utils/timeunits");
const AbstractParserWithWordBoundaryChecking_1 = require("./AbstractParserWithWordBoundaryChecking");
class UKTimeUnitCasualRelativeFormatParser extends AbstractParserWithWordBoundaryChecking_1.AbstractParserWithLeftRightBoundaryChecking {
    innerPatternString(context) {
        return `(ці|останні|минулі|майбутні|наступні|після|через|\\+|-)\\s*(${constants_1.TIME_UNITS_PATTERN})`;
    }
    innerExtract(context, match) {
        const prefix = match[1].toLowerCase();
        let timeUnits = (0, constants_1.parseTimeUnits)(match[3]);
        switch (prefix) {
            case "останні":
            case "минулі":
            case "-":
                timeUnits = (0, timeunits_1.reverseTimeUnits)(timeUnits);
                break;
        }
        return results_1.ParsingComponents.createRelativeFromReference(context.reference, timeUnits);
    }
}
exports.default = UKTimeUnitCasualRelativeFormatParser;
//# sourceMappingURL=UKTimeUnitCasualRelativeFormatParser.js.map