import { findYearClosestToRef } from "../../../calculation/years.js";
import { MONTH_DICTIONARY } from "../constants.js";
import { YEAR_PATTERN, parseYearPattern } from "../constants.js";
import { ORDINAL_NUMBER_PATTERN, parseOrdinalNumberPattern } from "../constants.js";
import { matchAnyPattern } from "../../../utils/pattern.js";
import { AbstractParserWithLeftRightBoundaryChecking } from "./AbstractParserWithWordBoundaryChecking.js";
const DATE_GROUP = 1;
const DATE_TO_GROUP = 2;
const MONTH_NAME_GROUP = 3;
const YEAR_GROUP = 4;
export default class UKMonthNameLittleEndianParser extends AbstractParserWithLeftRightBoundaryChecking {
    innerPatternString(context) {
        return (`(?:з|із)?\\s*(${ORDINAL_NUMBER_PATTERN})` +
            `(?:` +
            `\\s{0,3}(?:по|-|–|до)?\\s{0,3}` +
            `(${ORDINAL_NUMBER_PATTERN})` +
            `)?` +
            `(?:-|\\/|\\s{0,3}(?:of)?\\s{0,3})` +
            `(${matchAnyPattern(MONTH_DICTIONARY)})` +
            `(?:` +
            `(?:-|\\/|,?\\s{0,3})` +
            `(${YEAR_PATTERN}(?![^\\s]\\d))` +
            `)?`);
    }
    innerExtract(context, match) {
        const result = context.createParsingResult(match.index, match[0]);
        const month = MONTH_DICTIONARY[match[MONTH_NAME_GROUP].toLowerCase()];
        const day = parseOrdinalNumberPattern(match[DATE_GROUP]);
        if (day > 31) {
            match.index = match.index + match[DATE_GROUP].length;
            return null;
        }
        result.start.assign("month", month);
        result.start.assign("day", day);
        if (match[YEAR_GROUP]) {
            const yearNumber = parseYearPattern(match[YEAR_GROUP]);
            result.start.assign("year", yearNumber);
        }
        else {
            const year = findYearClosestToRef(context.reference.instant, day, month);
            result.start.imply("year", year);
        }
        if (match[DATE_TO_GROUP]) {
            const endDate = parseOrdinalNumberPattern(match[DATE_TO_GROUP]);
            result.end = result.start.clone();
            result.end.assign("day", endDate);
        }
        return result;
    }
}
//# sourceMappingURL=UKMonthNameLittleEndianParser.js.map