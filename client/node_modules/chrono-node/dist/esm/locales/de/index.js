import { includeCommonConfiguration } from "../../configurations.js";
import { Chrono } from "../../chrono.js";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "../../results.js";
import { Meridiem, Weekday } from "../../types.js";
import SlashDateFormatParser from "../../common/parsers/SlashDateFormatParser.js";
import ISOFormatParser from "../../common/parsers/ISOFormatParser.js";
import DETimeExpressionParser from "./parsers/DETimeExpressionParser.js";
import DEWeekdayParser from "./parsers/DEWeekdayParser.js";
import DESpecificTimeExpressionParser from "./parsers/DESpecificTimeExpressionParser.js";
import DEMergeDateRangeRefiner from "./refiners/DEMergeDateRangeRefiner.js";
import DEMergeDateTimeRefiner from "./refiners/DEMergeDateTimeRefiner.js";
import DECasualDateParser from "./parsers/DECasualDateParser.js";
import DECasualTimeParser from "./parsers/DECasualTimeParser.js";
import DEMonthNameLittleEndianParser from "./parsers/DEMonthNameLittleEndianParser.js";
import DETimeUnitRelativeFormatParser from "./parsers/DETimeUnitRelativeFormatParser.js";
import DETimeUnitWithinFormatParser from "./parsers/DETimeUnitWithinFormatParser.js";
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
    option.parsers.unshift(new DECasualTimeParser());
    option.parsers.unshift(new DECasualDateParser());
    option.parsers.unshift(new DETimeUnitRelativeFormatParser());
    return option;
}
export function createConfiguration(strictMode = true, littleEndian = true) {
    return includeCommonConfiguration({
        parsers: [
            new ISOFormatParser(),
            new SlashDateFormatParser(littleEndian),
            new DETimeExpressionParser(),
            new DESpecificTimeExpressionParser(),
            new DEMonthNameLittleEndianParser(),
            new DEWeekdayParser(),
            new DETimeUnitWithinFormatParser(),
        ],
        refiners: [new DEMergeDateRangeRefiner(), new DEMergeDateTimeRefiner()],
    }, strictMode);
}
//# sourceMappingURL=index.js.map