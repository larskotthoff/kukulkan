import UKTimeUnitWithinFormatParser from "./parsers/UKTimeUnitWithinFormatParser.js";
import UKMonthNameLittleEndianParser from "./parsers/UKMonthNameLittleEndianParser.js";
import UkMonthNameParser from "./parsers/UKMonthNameParser.js";
import UKTimeExpressionParser from "./parsers/UKTimeExpressionParser.js";
import UKTimeUnitAgoFormatParser from "./parsers/UKTimeUnitAgoFormatParser.js";
import UKMergeDateRangeRefiner from "./refiners/UKMergeDateRangeRefiner.js";
import UKMergeDateTimeRefiner from "./refiners/UKMergeDateTimeRefiner.js";
import { includeCommonConfiguration } from "../../configurations.js";
import UKCasualDateParser from "./parsers/UKCasualDateParser.js";
import UKCasualTimeParser from "./parsers/UKCasualTimeParser.js";
import UKWeekdayParser from "./parsers/UKWeekdayParser.js";
import UKRelativeDateFormatParser from "./parsers/UKRelativeDateFormatParser.js";
import { Chrono } from "../../chrono.js";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "../../results.js";
import { Meridiem, Weekday } from "../../types.js";
import SlashDateFormatParser from "../../common/parsers/SlashDateFormatParser.js";
import UKTimeUnitCasualRelativeFormatParser from "./parsers/UKTimeUnitCasualRelativeFormatParser.js";
import ISOFormatParser from "../../common/parsers/ISOFormatParser.js";
export { Chrono, ParsingResult, ParsingComponents, ReferenceWithTimezone };
export { Meridiem, Weekday };
export const casual = new Chrono(createCasualConfiguration());
export const strict = new Chrono(createConfiguration(true));
export function createCasualConfiguration() {
    const option = createConfiguration(false);
    option.parsers.unshift(new UKCasualDateParser());
    option.parsers.unshift(new UKCasualTimeParser());
    option.parsers.unshift(new UkMonthNameParser());
    option.parsers.unshift(new UKRelativeDateFormatParser());
    option.parsers.unshift(new UKTimeUnitCasualRelativeFormatParser());
    return option;
}
export function createConfiguration(strictMode) {
    return includeCommonConfiguration({
        parsers: [
            new ISOFormatParser(),
            new SlashDateFormatParser(true),
            new UKTimeUnitWithinFormatParser(),
            new UKMonthNameLittleEndianParser(),
            new UKWeekdayParser(),
            new UKTimeExpressionParser(strictMode),
            new UKTimeUnitAgoFormatParser(),
        ],
        refiners: [new UKMergeDateTimeRefiner(), new UKMergeDateRangeRefiner()],
    }, strictMode);
}
export function parse(text, ref, option) {
    return casual.parse(text, ref, option);
}
export function parseDate(text, ref, option) {
    return casual.parseDate(text, ref, option);
}
//# sourceMappingURL=index.js.map