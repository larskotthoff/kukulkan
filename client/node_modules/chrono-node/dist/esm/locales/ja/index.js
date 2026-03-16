import JPStandardParser from "./parsers/JPStandardParser.js";
import JPMergeDateRangeRefiner from "./refiners/JPMergeDateRangeRefiner.js";
import JPCasualDateParser from "./parsers/JPCasualDateParser.js";
import JPWeekdayParser from "./parsers/JPWeekdayParser.js";
import JPSlashDateFormatParser from "./parsers/JPSlashDateFormatParser.js";
import JPTimeExpressionParser from "./parsers/JPTimeExpressionParser.js";
import JPMergeDateTimeRefiner from "./refiners/JPMergeDateTimeRefiner.js";
import { Chrono } from "../../chrono.js";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "../../results.js";
import { Meridiem, Weekday } from "../../types.js";
import JPMergeWeekdayComponentRefiner from "./refiners/JPMergeWeekdayComponentRefiner.js";
import JPWeekdayWithParenthesesParser from "./parsers/JPWeekdayWithParenthesesParser.js";
import { includeCommonConfiguration } from "../../configurations.js";
import MergeWeekdayComponentRefiner from "../../common/refiners/MergeWeekdayComponentRefiner.js";
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
    option.parsers.unshift(new JPCasualDateParser());
    return option;
}
export function createConfiguration(strictMode = true) {
    const configuration = includeCommonConfiguration({
        parsers: [
            new JPStandardParser(),
            new JPWeekdayParser(),
            new JPWeekdayWithParenthesesParser(),
            new JPSlashDateFormatParser(),
            new JPTimeExpressionParser(),
        ],
        refiners: [
            new JPMergeWeekdayComponentRefiner(),
            new JPMergeDateTimeRefiner(),
            new JPMergeDateRangeRefiner(),
        ],
    }, strictMode);
    configuration.refiners = configuration.refiners.filter((refiner) => !(refiner instanceof MergeWeekdayComponentRefiner));
    return configuration;
}
//# sourceMappingURL=index.js.map