import ExtractTimezoneOffsetRefiner from "../../../common/refiners/ExtractTimezoneOffsetRefiner.js";
import { includeCommonConfiguration } from "../../../configurations.js";
import { Chrono } from "../../../chrono.js";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "../../../results.js";
import { Meridiem, Weekday } from "../../../types.js";
import ZHHansCasualDateParser from "./parsers/ZHHansCasualDateParser.js";
import ZHHansDateParser from "./parsers/ZHHansDateParser.js";
import ZHHansDeadlineFormatParser from "./parsers/ZHHansDeadlineFormatParser.js";
import ZHHansRelationWeekdayParser from "./parsers/ZHHansRelationWeekdayParser.js";
import ZHHansTimeExpressionParser from "./parsers/ZHHansTimeExpressionParser.js";
import ZHHansWeekdayParser from "./parsers/ZHHansWeekdayParser.js";
import ZHHansMergeDateRangeRefiner from "./refiners/ZHHansMergeDateRangeRefiner.js";
import ZHHansMergeDateTimeRefiner from "./refiners/ZHHansMergeDateTimeRefiner.js";
export { Chrono, ParsingResult, ParsingComponents, ReferenceWithTimezone };
export { Meridiem, Weekday };
export const hans = new Chrono(createCasualConfiguration());
export const casual = new Chrono(createCasualConfiguration());
export const strict = new Chrono(createConfiguration());
export function parse(text, ref, option) {
    return casual.parse(text, ref, option);
}
export function parseDate(text, ref, option) {
    return casual.parseDate(text, ref, option);
}
export function createCasualConfiguration() {
    const option = createConfiguration();
    option.parsers.unshift(new ZHHansCasualDateParser());
    return option;
}
export function createConfiguration() {
    const configuration = includeCommonConfiguration({
        parsers: [
            new ZHHansDateParser(),
            new ZHHansRelationWeekdayParser(),
            new ZHHansWeekdayParser(),
            new ZHHansTimeExpressionParser(),
            new ZHHansDeadlineFormatParser(),
        ],
        refiners: [new ZHHansMergeDateRangeRefiner(), new ZHHansMergeDateTimeRefiner()],
    });
    configuration.refiners = configuration.refiners.filter((refiner) => !(refiner instanceof ExtractTimezoneOffsetRefiner));
    return configuration;
}
//# sourceMappingURL=index.js.map