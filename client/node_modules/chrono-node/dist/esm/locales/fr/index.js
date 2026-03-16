import { includeCommonConfiguration } from "../../configurations.js";
import { Chrono } from "../../chrono.js";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "../../results.js";
import { Meridiem, Weekday } from "../../types.js";
import FRCasualDateParser from "./parsers/FRCasualDateParser.js";
import FRCasualTimeParser from "./parsers/FRCasualTimeParser.js";
import SlashDateFormatParser from "../../common/parsers/SlashDateFormatParser.js";
import FRTimeExpressionParser from "./parsers/FRTimeExpressionParser.js";
import FRMergeDateTimeRefiner from "./refiners/FRMergeDateTimeRefiner.js";
import FRMergeDateRangeRefiner from "./refiners/FRMergeDateRangeRefiner.js";
import FRWeekdayParser from "./parsers/FRWeekdayParser.js";
import FRSpecificTimeExpressionParser from "./parsers/FRSpecificTimeExpressionParser.js";
import FRMonthNameLittleEndianParser from "./parsers/FRMonthNameLittleEndianParser.js";
import FRTimeUnitAgoFormatParser from "./parsers/FRTimeUnitAgoFormatParser.js";
import FRTimeUnitWithinFormatParser from "./parsers/FRTimeUnitWithinFormatParser.js";
import FRTimeUnitRelativeFormatParser from "./parsers/FRTimeUnitRelativeFormatParser.js";
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
    option.parsers.unshift(new FRCasualDateParser());
    option.parsers.unshift(new FRCasualTimeParser());
    option.parsers.unshift(new FRTimeUnitRelativeFormatParser());
    return option;
}
export function createConfiguration(strictMode = true, littleEndian = true) {
    return includeCommonConfiguration({
        parsers: [
            new SlashDateFormatParser(littleEndian),
            new FRMonthNameLittleEndianParser(),
            new FRTimeExpressionParser(),
            new FRSpecificTimeExpressionParser(),
            new FRTimeUnitAgoFormatParser(),
            new FRTimeUnitWithinFormatParser(),
            new FRWeekdayParser(),
        ],
        refiners: [new FRMergeDateTimeRefiner(), new FRMergeDateRangeRefiner()],
    }, strictMode);
}
//# sourceMappingURL=index.js.map