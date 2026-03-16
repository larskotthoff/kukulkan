import { includeCommonConfiguration } from "../../configurations.js";
import { Chrono } from "../../chrono.js";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "../../results.js";
import { Meridiem, Weekday } from "../../types.js";
import NLMergeDateRangeRefiner from "./refiners/NLMergeDateRangeRefiner.js";
import NLMergeDateTimeRefiner from "./refiners/NLMergeDateTimeRefiner.js";
import NLCasualDateParser from "./parsers/NLCasualDateParser.js";
import NLCasualTimeParser from "./parsers/NLCasualTimeParser.js";
import SlashDateFormatParser from "../../common/parsers/SlashDateFormatParser.js";
import NLTimeUnitWithinFormatParser from "./parsers/NLTimeUnitWithinFormatParser.js";
import NLWeekdayParser from "./parsers/NLWeekdayParser.js";
import NLMonthNameMiddleEndianParser from "./parsers/NLMonthNameMiddleEndianParser.js";
import NLMonthNameParser from "./parsers/NLMonthNameParser.js";
import NLSlashMonthFormatParser from "./parsers/NLSlashMonthFormatParser.js";
import NLTimeExpressionParser from "./parsers/NLTimeExpressionParser.js";
import NLCasualYearMonthDayParser from "./parsers/NLCasualYearMonthDayParser.js";
import NLCasualDateTimeParser from "./parsers/NLCasualDateTimeParser.js";
import NLTimeUnitCasualRelativeFormatParser from "./parsers/NLTimeUnitCasualRelativeFormatParser.js";
import NLRelativeDateFormatParser from "./parsers/NLRelativeDateFormatParser.js";
import NLTimeUnitAgoFormatParser from "./parsers/NLTimeUnitAgoFormatParser.js";
import NLTimeUnitLaterFormatParser from "./parsers/NLTimeUnitLaterFormatParser.js";
export { Chrono, ParsingResult, ParsingComponents, ReferenceWithTimezone };
export { Meridiem, Weekday };
export const casual = new Chrono(createCasualConfiguration());
export const strict = new Chrono(createConfiguration(true));
export function parse(text, ref, option) {
    return casual.parse(text, ref, option);
}
export function parseDate(text, ref, option) {
    return casual.parseDate(text, ref, option);
}
export function createCasualConfiguration(littleEndian = true) {
    const option = createConfiguration(false, littleEndian);
    option.parsers.unshift(new NLCasualDateParser());
    option.parsers.unshift(new NLCasualTimeParser());
    option.parsers.unshift(new NLCasualDateTimeParser());
    option.parsers.unshift(new NLMonthNameParser());
    option.parsers.unshift(new NLRelativeDateFormatParser());
    option.parsers.unshift(new NLTimeUnitCasualRelativeFormatParser());
    return option;
}
export function createConfiguration(strictMode = true, littleEndian = true) {
    return includeCommonConfiguration({
        parsers: [
            new SlashDateFormatParser(littleEndian),
            new NLTimeUnitWithinFormatParser(),
            new NLMonthNameMiddleEndianParser(),
            new NLMonthNameParser(),
            new NLWeekdayParser(),
            new NLCasualYearMonthDayParser(),
            new NLSlashMonthFormatParser(),
            new NLTimeExpressionParser(strictMode),
            new NLTimeUnitAgoFormatParser(strictMode),
            new NLTimeUnitLaterFormatParser(strictMode),
        ],
        refiners: [new NLMergeDateTimeRefiner(), new NLMergeDateRangeRefiner()],
    }, strictMode);
}
//# sourceMappingURL=index.js.map