import { includeCommonConfiguration } from "../../configurations.js";
import { Chrono } from "../../chrono.js";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "../../results.js";
import { Meridiem, Weekday } from "../../types.js";
import ExtractTimezoneOffsetRefiner from "../../common/refiners/ExtractTimezoneOffsetRefiner.js";
import ZHHansDateParser from "./hans/parsers/ZHHansDateParser.js";
import ZHHansDeadlineFormatParser from "./hans/parsers/ZHHansDeadlineFormatParser.js";
import ZHHansRelationWeekdayParser from "./hans/parsers/ZHHansRelationWeekdayParser.js";
import ZHHansTimeExpressionParser from "./hans/parsers/ZHHansTimeExpressionParser.js";
import ZHHansWeekdayParser from "./hans/parsers/ZHHansWeekdayParser.js";
import ZHHantCasualDateParser from "./hant/parsers/ZHHantCasualDateParser.js";
import ZHHantDateParser from "./hant/parsers/ZHHantDateParser.js";
import ZHHantDeadlineFormatParser from "./hant/parsers/ZHHantDeadlineFormatParser.js";
import ZHHantRelationWeekdayParser from "./hant/parsers/ZHHantRelationWeekdayParser.js";
import ZHHantTimeExpressionParser from "./hant/parsers/ZHHantTimeExpressionParser.js";
import ZHHantWeekdayParser from "./hant/parsers/ZHHantWeekdayParser.js";
import ZHHantMergeDateRangeRefiner from "./hant/refiners/ZHHantMergeDateRangeRefiner.js";
import ZHHantMergeDateTimeRefiner from "./hant/refiners/ZHHantMergeDateTimeRefiner.js";
export * as hant from "./hant/index.js";
export * as hans from "./hans/index.js";
export { Chrono, ParsingResult, ParsingComponents, ReferenceWithTimezone };
export { Meridiem, Weekday };
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
            new ZHHansDateParser(),
            new ZHHantRelationWeekdayParser(),
            new ZHHansRelationWeekdayParser(),
            new ZHHantWeekdayParser(),
            new ZHHansWeekdayParser(),
            new ZHHantTimeExpressionParser(),
            new ZHHansTimeExpressionParser(),
            new ZHHantDeadlineFormatParser(),
            new ZHHansDeadlineFormatParser(),
        ],
        refiners: [new ZHHantMergeDateRangeRefiner(), new ZHHantMergeDateTimeRefiner()],
    });
    configuration.refiners = configuration.refiners.filter((refiner) => !(refiner instanceof ExtractTimezoneOffsetRefiner));
    return configuration;
}
//# sourceMappingURL=index.js.map