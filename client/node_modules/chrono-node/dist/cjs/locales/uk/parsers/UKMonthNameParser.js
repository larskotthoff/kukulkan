"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const years_1 = require("../../../calculation/years");
const pattern_1 = require("../../../utils/pattern");
const constants_2 = require("../constants");
const AbstractParserWithWordBoundaryChecking_1 = require("./AbstractParserWithWordBoundaryChecking");
const MONTH_NAME_GROUP = 2;
const YEAR_GROUP = 3;
class UkMonthNameParser extends AbstractParserWithWordBoundaryChecking_1.AbstractParserWithLeftBoundaryChecking {
    innerPatternString(context) {
        return (`((?:в|у)\\s*)?` +
            `(${(0, pattern_1.matchAnyPattern)(constants_1.MONTH_DICTIONARY)})` +
            `\\s*` +
            `(?:` +
            `[,-]?\\s*(${constants_2.YEAR_PATTERN})?` +
            `)?` +
            `(?=[^\\s\\w]|\\s+[^0-9]|\\s+$|$)`);
    }
    innerExtract(context, match) {
        const monthName = match[MONTH_NAME_GROUP].toLowerCase();
        if (match[0].length <= 3 && !constants_1.FULL_MONTH_NAME_DICTIONARY[monthName]) {
            return null;
        }
        const result = context.createParsingResult(match.index, match.index + match[0].length);
        result.start.imply("day", 1);
        const month = constants_1.MONTH_DICTIONARY[monthName];
        result.start.assign("month", month);
        if (match[YEAR_GROUP]) {
            const year = (0, constants_2.parseYearPattern)(match[YEAR_GROUP]);
            result.start.assign("year", year);
        }
        else {
            const year = (0, years_1.findYearClosestToRef)(context.reference.instant, 1, month);
            result.start.imply("year", year);
        }
        return result;
    }
}
exports.default = UkMonthNameParser;
//# sourceMappingURL=UKMonthNameParser.js.map