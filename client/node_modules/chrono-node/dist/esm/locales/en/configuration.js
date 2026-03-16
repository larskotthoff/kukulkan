import ENTimeUnitWithinFormatParser from "./parsers/ENTimeUnitWithinFormatParser.js";
import ENMonthNameLittleEndianParser from "./parsers/ENMonthNameLittleEndianParser.js";
import ENMonthNameMiddleEndianParser from "./parsers/ENMonthNameMiddleEndianParser.js";
import ENMonthNameParser from "./parsers/ENMonthNameParser.js";
import ENYearMonthDayParser from "./parsers/ENYearMonthDayParser.js";
import ENSlashMonthFormatParser from "./parsers/ENSlashMonthFormatParser.js";
import ENTimeExpressionParser from "./parsers/ENTimeExpressionParser.js";
import ENTimeUnitAgoFormatParser from "./parsers/ENTimeUnitAgoFormatParser.js";
import ENTimeUnitLaterFormatParser from "./parsers/ENTimeUnitLaterFormatParser.js";
import ENMergeDateRangeRefiner from "./refiners/ENMergeDateRangeRefiner.js";
import ENMergeDateTimeRefiner from "./refiners/ENMergeDateTimeRefiner.js";
import { includeCommonConfiguration } from "../../configurations.js";
import ENCasualDateParser from "./parsers/ENCasualDateParser.js";
import ENCasualTimeParser from "./parsers/ENCasualTimeParser.js";
import ENWeekdayParser from "./parsers/ENWeekdayParser.js";
import ENRelativeDateFormatParser from "./parsers/ENRelativeDateFormatParser.js";
import SlashDateFormatParser from "../../common/parsers/SlashDateFormatParser.js";
import ENTimeUnitCasualRelativeFormatParser from "./parsers/ENTimeUnitCasualRelativeFormatParser.js";
import ENMergeRelativeAfterDateRefiner from "./refiners/ENMergeRelativeAfterDateRefiner.js";
import ENMergeRelativeFollowByDateRefiner from "./refiners/ENMergeRelativeFollowByDateRefiner.js";
import OverlapRemovalRefiner from "../../common/refiners/OverlapRemovalRefiner.js";
import ENExtractYearSuffixRefiner from "./refiners/ENExtractYearSuffixRefiner.js";
import ENUnlikelyFormatFilter from "./refiners/ENUnlikelyFormatFilter.js";
export default class ENDefaultConfiguration {
    createCasualConfiguration(littleEndian = false) {
        const option = this.createConfiguration(false, littleEndian);
        option.parsers.push(new ENCasualDateParser());
        option.parsers.push(new ENCasualTimeParser());
        option.parsers.push(new ENMonthNameParser());
        option.parsers.push(new ENRelativeDateFormatParser());
        option.parsers.push(new ENTimeUnitCasualRelativeFormatParser());
        option.refiners.push(new ENUnlikelyFormatFilter());
        return option;
    }
    createConfiguration(strictMode = true, littleEndian = false) {
        const options = includeCommonConfiguration({
            parsers: [
                new SlashDateFormatParser(littleEndian),
                new ENTimeUnitWithinFormatParser(strictMode),
                new ENMonthNameLittleEndianParser(),
                new ENMonthNameMiddleEndianParser(littleEndian),
                new ENWeekdayParser(),
                new ENSlashMonthFormatParser(),
                new ENTimeExpressionParser(strictMode),
                new ENTimeUnitAgoFormatParser(strictMode),
                new ENTimeUnitLaterFormatParser(strictMode),
            ],
            refiners: [new ENMergeDateTimeRefiner()],
        }, strictMode);
        options.parsers.unshift(new ENYearMonthDayParser(strictMode));
        options.refiners.unshift(new ENMergeRelativeFollowByDateRefiner());
        options.refiners.unshift(new ENMergeRelativeAfterDateRefiner());
        options.refiners.unshift(new OverlapRemovalRefiner());
        options.refiners.push(new ENMergeDateTimeRefiner());
        options.refiners.push(new ENExtractYearSuffixRefiner());
        options.refiners.push(new ENMergeDateRangeRefiner());
        return options;
    }
}
//# sourceMappingURL=configuration.js.map