import ExtractTimezoneOffsetRefiner from "../../../common/refiners/ExtractTimezoneOffsetRefiner.js";
import { includeCommonConfiguration } from "../../../configurations.js";
import { Chrono } from "../../../chrono.js";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "../../../results.js";
import { Meridiem, Weekday } from "../../../types.js";
import ZHHantCasualDateParser from "./parsers/ZHHantCasualDateParser.js";
import ZHHantDateParser from "./parsers/ZHHantDateParser.js";
import ZHHantDeadlineFormatParser from "./parsers/ZHHantDeadlineFormatParser.js";
import ZHHantRelationWeekdayParser from "./parsers/ZHHantRelationWeekdayParser.js";
import ZHHantTimeExpressionParser from "./parsers/ZHHantTimeExpressionParser.js";
import ZHHantWeekdayParser from "./parsers/ZHHantWeekdayParser.js";
import ZHHantMergeDateRangeRefiner from "./refiners/ZHHantMergeDateRangeRefiner.js";
import ZHHantMergeDateTimeRefiner from "./refiners/ZHHantMergeDateTimeRefiner.js";
export { Chrono, ParsingResult, ParsingComponents, ReferenceWithTimezone };
export { Meridiem, Weekday };
export const hant = new Chrono(createCasualConfiguration());
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
    option.parsers.unshift(new ZHHantCasualDateParser());
    return option;
}
export function createConfiguration() {
    const configuration = includeCommonConfiguration({
        parsers: [
            new ZHHantDateParser(),
            new ZHHantRelationWeekdayParser(),
            new ZHHantWeekdayParser(),
            new ZHHantTimeExpressionParser(),
            new ZHHantDeadlineFormatParser(),
        ],
        refiners: [new ZHHantMergeDateRangeRefiner(), new ZHHantMergeDateTimeRefiner()],
    });
    configuration.refiners = configuration.refiners.filter((refiner) => !(refiner instanceof ExtractTimezoneOffsetRefiner));
    return configuration;
}
//# sourceMappingURL=index.js.map