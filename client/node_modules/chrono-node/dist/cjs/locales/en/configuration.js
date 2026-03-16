"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ENTimeUnitWithinFormatParser_1 = __importDefault(require("./parsers/ENTimeUnitWithinFormatParser"));
const ENMonthNameLittleEndianParser_1 = __importDefault(require("./parsers/ENMonthNameLittleEndianParser"));
const ENMonthNameMiddleEndianParser_1 = __importDefault(require("./parsers/ENMonthNameMiddleEndianParser"));
const ENMonthNameParser_1 = __importDefault(require("./parsers/ENMonthNameParser"));
const ENYearMonthDayParser_1 = __importDefault(require("./parsers/ENYearMonthDayParser"));
const ENSlashMonthFormatParser_1 = __importDefault(require("./parsers/ENSlashMonthFormatParser"));
const ENTimeExpressionParser_1 = __importDefault(require("./parsers/ENTimeExpressionParser"));
const ENTimeUnitAgoFormatParser_1 = __importDefault(require("./parsers/ENTimeUnitAgoFormatParser"));
const ENTimeUnitLaterFormatParser_1 = __importDefault(require("./parsers/ENTimeUnitLaterFormatParser"));
const ENMergeDateRangeRefiner_1 = __importDefault(require("./refiners/ENMergeDateRangeRefiner"));
const ENMergeDateTimeRefiner_1 = __importDefault(require("./refiners/ENMergeDateTimeRefiner"));
const configurations_1 = require("../../configurations");
const ENCasualDateParser_1 = __importDefault(require("./parsers/ENCasualDateParser"));
const ENCasualTimeParser_1 = __importDefault(require("./parsers/ENCasualTimeParser"));
const ENWeekdayParser_1 = __importDefault(require("./parsers/ENWeekdayParser"));
const ENRelativeDateFormatParser_1 = __importDefault(require("./parsers/ENRelativeDateFormatParser"));
const SlashDateFormatParser_1 = __importDefault(require("../../common/parsers/SlashDateFormatParser"));
const ENTimeUnitCasualRelativeFormatParser_1 = __importDefault(require("./parsers/ENTimeUnitCasualRelativeFormatParser"));
const ENMergeRelativeAfterDateRefiner_1 = __importDefault(require("./refiners/ENMergeRelativeAfterDateRefiner"));
const ENMergeRelativeFollowByDateRefiner_1 = __importDefault(require("./refiners/ENMergeRelativeFollowByDateRefiner"));
const OverlapRemovalRefiner_1 = __importDefault(require("../../common/refiners/OverlapRemovalRefiner"));
const ENExtractYearSuffixRefiner_1 = __importDefault(require("./refiners/ENExtractYearSuffixRefiner"));
const ENUnlikelyFormatFilter_1 = __importDefault(require("./refiners/ENUnlikelyFormatFilter"));
class ENDefaultConfiguration {
    createCasualConfiguration(littleEndian = false) {
        const option = this.createConfiguration(false, littleEndian);
        option.parsers.push(new ENCasualDateParser_1.default());
        option.parsers.push(new ENCasualTimeParser_1.default());
        option.parsers.push(new ENMonthNameParser_1.default());
        option.parsers.push(new ENRelativeDateFormatParser_1.default());
        option.parsers.push(new ENTimeUnitCasualRelativeFormatParser_1.default());
        option.refiners.push(new ENUnlikelyFormatFilter_1.default());
        return option;
    }
    createConfiguration(strictMode = true, littleEndian = false) {
        const options = (0, configurations_1.includeCommonConfiguration)({
            parsers: [
                new SlashDateFormatParser_1.default(littleEndian),
                new ENTimeUnitWithinFormatParser_1.default(strictMode),
                new ENMonthNameLittleEndianParser_1.default(),
                new ENMonthNameMiddleEndianParser_1.default(littleEndian),
                new ENWeekdayParser_1.default(),
                new ENSlashMonthFormatParser_1.default(),
                new ENTimeExpressionParser_1.default(strictMode),
                new ENTimeUnitAgoFormatParser_1.default(strictMode),
                new ENTimeUnitLaterFormatParser_1.default(strictMode),
            ],
            refiners: [new ENMergeDateTimeRefiner_1.default()],
        }, strictMode);
        options.parsers.unshift(new ENYearMonthDayParser_1.default(strictMode));
        options.refiners.unshift(new ENMergeRelativeFollowByDateRefiner_1.default());
        options.refiners.unshift(new ENMergeRelativeAfterDateRefiner_1.default());
        options.refiners.unshift(new OverlapRemovalRefiner_1.default());
        options.refiners.push(new ENMergeDateTimeRefiner_1.default());
        options.refiners.push(new ENExtractYearSuffixRefiner_1.default());
        options.refiners.push(new ENMergeDateRangeRefiner_1.default());
        return options;
    }
}
exports.default = ENDefaultConfiguration;
//# sourceMappingURL=configuration.js.map