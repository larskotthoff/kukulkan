import { includeCommonConfiguration } from "../../configurations.js";
import { Chrono } from "../../chrono.js";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "../../results.js";
import { Meridiem, Weekday } from "../../types.js";
import SlashDateFormatParser from "../../common/parsers/SlashDateFormatParser.js";
import PTWeekdayParser from "./parsers/PTWeekdayParser.js";
import PTTimeExpressionParser from "./parsers/PTTimeExpressionParser.js";
import PTMergeDateTimeRefiner from "./refiners/PTMergeDateTimeRefiner.js";
import PTMergeDateRangeRefiner from "./refiners/PTMergeDateRangeRefiner.js";
import PTMonthNameLittleEndianParser from "./parsers/PTMonthNameLittleEndianParser.js";
import PTCasualDateParser from "./parsers/PTCasualDateParser.js";
import PTCasualTimeParser from "./parsers/PTCasualTimeParser.js";
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
    option.parsers.push(new PTCasualDateParser());
    option.parsers.push(new PTCasualTimeParser());
    return option;
}
export function createConfiguration(strictMode = true, littleEndian = true) {
    return includeCommonConfiguration({
        parsers: [
            new SlashDateFormatParser(littleEndian),
            new PTWeekdayParser(),
            new PTTimeExpressionParser(),
            new PTMonthNameLittleEndianParser(),
        ],
        refiners: [new PTMergeDateTimeRefiner(), new PTMergeDateRangeRefiner()],
    }, strictMode);
}
//# sourceMappingURL=index.js.map