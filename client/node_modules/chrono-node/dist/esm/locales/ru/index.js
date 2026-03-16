import RUTimeUnitWithinFormatParser from "./parsers/RUTimeUnitWithinFormatParser.js";
import RUMonthNameLittleEndianParser from "./parsers/RUMonthNameLittleEndianParser.js";
import RUMonthNameParser from "./parsers/RUMonthNameParser.js";
import RUTimeExpressionParser from "./parsers/RUTimeExpressionParser.js";
import RUTimeUnitAgoFormatParser from "./parsers/RUTimeUnitAgoFormatParser.js";
import RUMergeDateRangeRefiner from "./refiners/RUMergeDateRangeRefiner.js";
import RUMergeDateTimeRefiner from "./refiners/RUMergeDateTimeRefiner.js";
import { includeCommonConfiguration } from "../../configurations.js";
import RUCasualDateParser from "./parsers/RUCasualDateParser.js";
import RUCasualTimeParser from "./parsers/RUCasualTimeParser.js";
import RUWeekdayParser from "./parsers/RUWeekdayParser.js";
import RURelativeDateFormatParser from "./parsers/RURelativeDateFormatParser.js";
import { Chrono } from "../../chrono.js";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "../../results.js";
import { Meridiem, Weekday } from "../../types.js";
import SlashDateFormatParser from "../../common/parsers/SlashDateFormatParser.js";
import RUTimeUnitCasualRelativeFormatParser from "./parsers/RUTimeUnitCasualRelativeFormatParser.js";
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
export function createCasualConfiguration() {
    const option = createConfiguration(false);
    option.parsers.unshift(new RUCasualDateParser());
    option.parsers.unshift(new RUCasualTimeParser());
    option.parsers.unshift(new RUMonthNameParser());
    option.parsers.unshift(new RURelativeDateFormatParser());
    option.parsers.unshift(new RUTimeUnitCasualRelativeFormatParser());
    return option;
}
export function createConfiguration(strictMode = true) {
    return includeCommonConfiguration({
        parsers: [
            new SlashDateFormatParser(true),
            new RUTimeUnitWithinFormatParser(),
            new RUMonthNameLittleEndianParser(),
            new RUWeekdayParser(),
            new RUTimeExpressionParser(strictMode),
            new RUTimeUnitAgoFormatParser(),
        ],
        refiners: [new RUMergeDateTimeRefiner(), new RUMergeDateRangeRefiner()],
    }, strictMode);
}
//# sourceMappingURL=index.js.map