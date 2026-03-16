import ENTimeUnitWithinFormatParser from "./parsers/ITTimeUnitWithinFormatParser.js";
import ENMonthNameLittleEndianParser from "./parsers/ITMonthNameLittleEndianParser.js";
import ENMonthNameMiddleEndianParser from "./parsers/ITMonthNameMiddleEndianParser.js";
import ENMonthNameParser from "./parsers/ITMonthNameParser.js";
import ENCasualYearMonthDayParser from "./parsers/ITCasualYearMonthDayParser.js";
import ENSlashMonthFormatParser from "./parsers/ITSlashMonthFormatParser.js";
import ENTimeExpressionParser from "./parsers/ITTimeExpressionParser.js";
import ENTimeUnitAgoFormatParser from "./parsers/ITTimeUnitAgoFormatParser.js";
import ENTimeUnitLaterFormatParser from "./parsers/ITTimeUnitLaterFormatParser.js";
import ENMergeDateRangeRefiner from "./refiners/ITMergeDateRangeRefiner.js";
import ENMergeDateTimeRefiner from "./refiners/ITMergeDateTimeRefiner.js";
import { includeCommonConfiguration } from "../../configurations.js";
import ENCasualDateParser from "./parsers/ITCasualDateParser.js";
import ENCasualTimeParser from "./parsers/ITCasualTimeParser.js";
import ENWeekdayParser from "./parsers/ITWeekdayParser.js";
import ITRelativeDateFormatParser from "./parsers/ITRelativeDateFormatParser.js";
import { Chrono } from "../../chrono.js";
import SlashDateFormatParser from "../../common/parsers/SlashDateFormatParser.js";
import ENTimeUnitCasualRelativeFormatParser from "./parsers/ITTimeUnitCasualRelativeFormatParser.js";
import ENMergeRelativeDateRefiner from "./refiners/ITMergeRelativeDateRefiner.js";
export const casual = new Chrono(createCasualConfiguration(false));
export const strict = new Chrono(createConfiguration(true, false));
export const GB = new Chrono(createConfiguration(false, true));
export function parse(text, ref, option) {
    return casual.parse(text, ref, option);
}
export function parseDate(text, ref, option) {
    return casual.parseDate(text, ref, option);
}
export function createCasualConfiguration(littleEndian = false) {
    const option = createConfiguration(false, littleEndian);
    option.parsers.unshift(new ENCasualDateParser());
    option.parsers.unshift(new ENCasualTimeParser());
    option.parsers.unshift(new ENMonthNameParser());
    option.parsers.unshift(new ITRelativeDateFormatParser());
    option.parsers.unshift(new ENTimeUnitCasualRelativeFormatParser());
    return option;
}
export function createConfiguration(strictMode = true, littleEndian = false) {
    return includeCommonConfiguration({
        parsers: [
            new SlashDateFormatParser(littleEndian),
            new ENTimeUnitWithinFormatParser(),
            new ENMonthNameLittleEndianParser(),
            new ENMonthNameMiddleEndianParser(),
            new ENWeekdayParser(),
            new ENCasualYearMonthDayParser(),
            new ENSlashMonthFormatParser(),
            new ENTimeExpressionParser(strictMode),
            new ENTimeUnitAgoFormatParser(strictMode),
            new ENTimeUnitLaterFormatParser(strictMode),
        ],
        refiners: [new ENMergeRelativeDateRefiner(), new ENMergeDateTimeRefiner(), new ENMergeDateRangeRefiner()],
    }, strictMode);
}
//# sourceMappingURL=index.js.map