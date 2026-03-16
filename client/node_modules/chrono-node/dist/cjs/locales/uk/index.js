"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strict = exports.casual = exports.Weekday = exports.Meridiem = exports.ReferenceWithTimezone = exports.ParsingComponents = exports.ParsingResult = exports.Chrono = void 0;
exports.createCasualConfiguration = createCasualConfiguration;
exports.createConfiguration = createConfiguration;
exports.parse = parse;
exports.parseDate = parseDate;
const UKTimeUnitWithinFormatParser_1 = __importDefault(require("./parsers/UKTimeUnitWithinFormatParser"));
const UKMonthNameLittleEndianParser_1 = __importDefault(require("./parsers/UKMonthNameLittleEndianParser"));
const UKMonthNameParser_1 = __importDefault(require("./parsers/UKMonthNameParser"));
const UKTimeExpressionParser_1 = __importDefault(require("./parsers/UKTimeExpressionParser"));
const UKTimeUnitAgoFormatParser_1 = __importDefault(require("./parsers/UKTimeUnitAgoFormatParser"));
const UKMergeDateRangeRefiner_1 = __importDefault(require("./refiners/UKMergeDateRangeRefiner"));
const UKMergeDateTimeRefiner_1 = __importDefault(require("./refiners/UKMergeDateTimeRefiner"));
const configurations_1 = require("../../configurations");
const UKCasualDateParser_1 = __importDefault(require("./parsers/UKCasualDateParser"));
const UKCasualTimeParser_1 = __importDefault(require("./parsers/UKCasualTimeParser"));
const UKWeekdayParser_1 = __importDefault(require("./parsers/UKWeekdayParser"));
const UKRelativeDateFormatParser_1 = __importDefault(require("./parsers/UKRelativeDateFormatParser"));
const chrono_1 = require("../../chrono");
Object.defineProperty(exports, "Chrono", { enumerable: true, get: function () { return chrono_1.Chrono; } });
const results_1 = require("../../results");
Object.defineProperty(exports, "ParsingResult", { enumerable: true, get: function () { return results_1.ParsingResult; } });
Object.defineProperty(exports, "ParsingComponents", { enumerable: true, get: function () { return results_1.ParsingComponents; } });
Object.defineProperty(exports, "ReferenceWithTimezone", { enumerable: true, get: function () { return results_1.ReferenceWithTimezone; } });
const types_1 = require("../../types");
Object.defineProperty(exports, "Meridiem", { enumerable: true, get: function () { return types_1.Meridiem; } });
Object.defineProperty(exports, "Weekday", { enumerable: true, get: function () { return types_1.Weekday; } });
const SlashDateFormatParser_1 = __importDefault(require("../../common/parsers/SlashDateFormatParser"));
const UKTimeUnitCasualRelativeFormatParser_1 = __importDefault(require("./parsers/UKTimeUnitCasualRelativeFormatParser"));
const ISOFormatParser_1 = __importDefault(require("../../common/parsers/ISOFormatParser"));
exports.casual = new chrono_1.Chrono(createCasualConfiguration());
exports.strict = new chrono_1.Chrono(createConfiguration(true));
function createCasualConfiguration() {
    const option = createConfiguration(false);
    option.parsers.unshift(new UKCasualDateParser_1.default());
    option.parsers.unshift(new UKCasualTimeParser_1.default());
    option.parsers.unshift(new UKMonthNameParser_1.default());
    option.parsers.unshift(new UKRelativeDateFormatParser_1.default());
    option.parsers.unshift(new UKTimeUnitCasualRelativeFormatParser_1.default());
    return option;
}
function createConfiguration(strictMode) {
    return (0, configurations_1.includeCommonConfiguration)({
        parsers: [
            new ISOFormatParser_1.default(),
            new SlashDateFormatParser_1.default(true),
            new UKTimeUnitWithinFormatParser_1.default(),
            new UKMonthNameLittleEndianParser_1.default(),
            new UKWeekdayParser_1.default(),
            new UKTimeExpressionParser_1.default(strictMode),
            new UKTimeUnitAgoFormatParser_1.default(),
        ],
        refiners: [new UKMergeDateTimeRefiner_1.default(), new UKMergeDateRangeRefiner_1.default()],
    }, strictMode);
}
function parse(text, ref, option) {
    return exports.casual.parse(text, ref, option);
}
function parseDate(text, ref, option) {
    return exports.casual.parseDate(text, ref, option);
}
//# sourceMappingURL=index.js.map