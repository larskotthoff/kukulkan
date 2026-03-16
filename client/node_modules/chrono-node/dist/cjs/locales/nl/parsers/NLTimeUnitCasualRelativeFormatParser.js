"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const results_1 = require("../../../results");
const AbstractParserWithWordBoundary_1 = require("../../../common/parsers/AbstractParserWithWordBoundary");
const timeunits_1 = require("../../../utils/timeunits");
const PATTERN = new RegExp(`(dit|deze|vorig|afgelopen|(?:aan)?komend|over|\\+|-)e?\\s*(${constants_1.TIME_UNITS_PATTERN})(?=\\W|$)`, "i");
const PREFIX_WORD_GROUP = 1;
const TIME_UNIT_WORD_GROUP = 2;
class NLTimeUnitCasualRelativeFormatParser extends AbstractParserWithWordBoundary_1.AbstractParserWithWordBoundaryChecking {
    innerPattern() {
        return PATTERN;
    }
    innerExtract(context, match) {
        const prefix = match[PREFIX_WORD_GROUP].toLowerCase();
        let timeUnits = (0, constants_1.parseTimeUnits)(match[TIME_UNIT_WORD_GROUP]);
        switch (prefix) {
            case "vorig":
            case "afgelopen":
            case "-":
                timeUnits = (0, timeunits_1.reverseTimeUnits)(timeUnits);
                break;
        }
        return results_1.ParsingComponents.createRelativeFromReference(context.reference, timeUnits);
    }
}
exports.default = NLTimeUnitCasualRelativeFormatParser;
//# sourceMappingURL=NLTimeUnitCasualRelativeFormatParser.js.map