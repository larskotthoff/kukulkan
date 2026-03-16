"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GB = exports.strict = exports.casual = void 0;
exports.parse = parse;
exports.parseDate = parseDate;
exports.createCasualConfiguration = createCasualConfiguration;
exports.createConfiguration = createConfiguration;
const ITTimeUnitWithinFormatParser_1 = __importDefault(require("./parsers/ITTimeUnitWithinFormatParser"));
const ITMonthNameLittleEndianParser_1 = __importDefault(require("./parsers/ITMonthNameLittleEndianParser"));
const ITMonthNameMiddleEndianParser_1 = __importDefault(require("./parsers/ITMonthNameMiddleEndianParser"));
const ITMonthNameParser_1 = __importDefault(require("./parsers/ITMonthNameParser"));
const ITCasualYearMonthDayParser_1 = __importDefault(require("./parsers/ITCasualYearMonthDayParser"));
const ITSlashMonthFormatParser_1 = __importDefault(require("./parsers/ITSlashMonthFormatParser"));
const ITTimeExpressionParser_1 = __importDefault(require("./parsers/ITTimeExpressionParser"));
const ITTimeUnitAgoFormatParser_1 = __importDefault(require("./parsers/ITTimeUnitAgoFormatParser"));
const ITTimeUnitLaterFormatParser_1 = __importDefault(require("./parsers/ITTimeUnitLaterFormatParser"));
const ITMergeDateRangeRefiner_1 = __importDefault(require("./refiners/ITMergeDateRangeRefiner"));
const ITMergeDateTimeRefiner_1 = __importDefault(require("./refiners/ITMergeDateTimeRefiner"));
const configurations_1 = require("../../configurations");
const ITCasualDateParser_1 = __importDefault(require("./parsers/ITCasualDateParser"));
const ITCasualTimeParser_1 = __importDefault(require("./parsers/ITCasualTimeParser"));
const ITWeekdayParser_1 = __importDefault(require("./parsers/ITWeekdayParser"));
const ITRelativeDateFormatParser_1 = __importDefault(require("./parsers/ITRelativeDateFormatParser"));
const chrono_1 = require("../../chrono");
const SlashDateFormatParser_1 = __importDefault(require("../../common/parsers/SlashDateFormatParser"));
const ITTimeUnitCasualRelativeFormatParser_1 = __importDefault(require("./parsers/ITTimeUnitCasualRelativeFormatParser"));
const ITMergeRelativeDateRefiner_1 = __importDefault(require("./refiners/ITMergeRelativeDateRefiner"));
exports.casual = new chrono_1.Chrono(createCasualConfiguration(false));
exports.strict = new chrono_1.Chrono(createConfiguration(true, false));
exports.GB = new chrono_1.Chrono(createConfiguration(false, true));
function parse(text, ref, option) {
    return exports.casual.parse(text, ref, option);
}
function parseDate(text, ref, option) {
    return exports.casual.parseDate(text, ref, option);
}
function createCasualConfiguration(littleEndian = false) {
    const option = createConfiguration(false, littleEndian);
    option.parsers.unshift(new ITCasualDateParser_1.default());
    option.parsers.unshift(new ITCasualTimeParser_1.default());
    option.parsers.unshift(new ITMonthNameParser_1.default());
    option.parsers.unshift(new ITRelativeDateFormatParser_1.default());
    option.parsers.unshift(new ITTimeUnitCasualRelativeFormatParser_1.default());
    return option;
}
function createConfiguration(strictMode = true, littleEndian = false) {
    return (0, configurations_1.includeCommonConfiguration)({
        parsers: [
            new SlashDateFormatParser_1.default(littleEndian),
            new ITTimeUnitWithinFormatParser_1.default(),
            new ITMonthNameLittleEndianParser_1.default(),
            new ITMonthNameMiddleEndianParser_1.default(),
            new ITWeekdayParser_1.default(),
            new ITCasualYearMonthDayParser_1.default(),
            new ITSlashMonthFormatParser_1.default(),
            new ITTimeExpressionParser_1.default(strictMode),
            new ITTimeUnitAgoFormatParser_1.default(strictMode),
            new ITTimeUnitLaterFormatParser_1.default(strictMode),
        ],
        refiners: [new ITMergeRelativeDateRefiner_1.default(), new ITMergeDateTimeRefiner_1.default(), new ITMergeDateRangeRefiner_1.default()],
    }, strictMode);
}
//# sourceMappingURL=index.js.map