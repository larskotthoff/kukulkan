import { FULL_MONTH_NAME_DICTIONARY, MONTH_DICTIONARY } from "../constants.js";
import { findYearClosestToRef } from "../../../calculation/years.js";
import { matchAnyPattern } from "../../../utils/pattern.js";
import { YEAR_PATTERN, parseYearPattern } from "../constants.js";
import { AbstractParserWithLeftBoundaryChecking } from "./AbstractParserWithWordBoundaryChecking.js";
const MONTH_NAME_GROUP = 2;
const YEAR_GROUP = 3;
export default class UkMonthNameParser extends AbstractParserWithLeftBoundaryChecking {
    innerPatternString(context) {
        return (`((?:в|у)\\s*)?` +
            `(${matchAnyPattern(MONTH_DICTIONARY)})` +
            `\\s*` +
            `(?:` +
            `[,-]?\\s*(${YEAR_PATTERN})?` +
            `)?` +
            `(?=[^\\s\\w]|\\s+[^0-9]|\\s+$|$)`);
    }
    innerExtract(context, match) {
        const monthName = match[MONTH_NAME_GROUP].toLowerCase();
        if (match[0].length <= 3 && !FULL_MONTH_NAME_DICTIONARY[monthName]) {
            return null;
        }
        const result = context.createParsingResult(match.index, match.index + match[0].length);
        result.start.imply("day", 1);
        const month = MONTH_DICTIONARY[monthName];
        result.start.assign("month", month);
        if (match[YEAR_GROUP]) {
            const year = parseYearPattern(match[YEAR_GROUP]);
            result.start.assign("year", year);
        }
        else {
            const year = findYearClosestToRef(context.reference.instant, 1, month);
            result.start.imply("year", year);
        }
        return result;
    }
}
//# sourceMappingURL=UKMonthNameParser.js.map