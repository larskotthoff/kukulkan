import { includeCommonConfiguration } from "../../configurations.js";
import { Chrono } from "../../chrono.js";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "../../results.js";
import { Meridiem, Weekday } from "../../types.js";
import SlashDateFormatParser from "../../common/parsers/SlashDateFormatParser.js";
import ESWeekdayParser from "./parsers/ESWeekdayParser.js";
import ESTimeExpressionParser from "./parsers/ESTimeExpressionParser.js";
import ESMergeDateTimeRefiner from "./refiners/ESMergeDateTimeRefiner.js";
import ESMergeDateRangeRefiner from "./refiners/ESMergeDateRangeRefiner.js";
import ESMonthNameLittleEndianParser from "./parsers/ESMonthNameLittleEndianParser.js";
import ESCasualDateParser from "./parsers/ESCasualDateParser.js";
import ESCasualTimeParser from "./parsers/ESCasualTimeParser.js";
import ESTimeUnitWithinFormatParser from "./parsers/ESTimeUnitWithinFormatParser.js";
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
    option.parsers.push(new ESCasualDateParser());
    option.parsers.push(new ESCasualTimeParser());
    return option;
}
export function createConfiguration(strictMode = true, littleEndian = true) {
    return includeCommonConfiguration({
        parsers: [
            new SlashDateFormatParser(littleEndian),
            new ESWeekdayParser(),
            new ESTimeExpressionParser(),
            new ESMonthNameLittleEndianParser(),
            new ESTimeUnitWithinFormatParser(),
        ],
        refiners: [new ESMergeDateTimeRefiner(), new ESMergeDateRangeRefiner()],
    }, strictMode);
}
//# sourceMappingURL=index.js.map