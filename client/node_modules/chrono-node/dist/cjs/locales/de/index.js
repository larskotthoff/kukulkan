"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strict = exports.casual = exports.Weekday = exports.Meridiem = exports.ReferenceWithTimezone = exports.ParsingComponents = exports.ParsingResult = exports.Chrono = void 0;
exports.parse = parse;
exports.parseDate = parseDate;
exports.createCasualConfiguration = createCasualConfiguration;
exports.createConfiguration = createConfiguration;
const configurations_1 = require("../../configurations");
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
const ISOFormatParser_1 = __importDefault(require("../../common/parsers/ISOFormatParser"));
const DETimeExpressionParser_1 = __importDefault(require("./parsers/DETimeExpressionParser"));
const DEWeekdayParser_1 = __importDefault(require("./parsers/DEWeekdayParser"));
const DESpecificTimeExpressionParser_1 = __importDefault(require("./parsers/DESpecificTimeExpressionParser"));
const DEMergeDateRangeRefiner_1 = __importDefault(require("./refiners/DEMergeDateRangeRefiner"));
const DEMergeDateTimeRefiner_1 = __importDefault(require("./refiners/DEMergeDateTimeRefiner"));
const DECasualDateParser_1 = __importDefault(require("./parsers/DECasualDateParser"));
const DECasualTimeParser_1 = __importDefault(require("./parsers/DECasualTimeParser"));
const DEMonthNameLittleEndianParser_1 = __importDefault(require("./parsers/DEMonthNameLittleEndianParser"));
const DETimeUnitRelativeFormatParser_1 = __importDefault(require("./parsers/DETimeUnitRelativeFormatParser"));
const DETimeUnitWithinFormatParser_1 = __importDefault(require("./parsers/DETimeUnitWithinFormatParser"));
exports.casual = new chrono_1.Chrono(createCasualConfiguration());
exports.strict = new chrono_1.Chrono(createConfiguration(true));
function parse(text, ref, option) {
    return exports.casual.parse(text, ref, option);
}
function parseDate(text, ref, option) {
    return exports.casual.parseDate(text, ref, option);
}
function createCasualConfiguration(littleEndian = true) {
    const option = createConfiguration(false, littleEndian);
    option.parsers.unshift(new DECasualTimeParser_1.default());
    option.parsers.unshift(new DECasualDateParser_1.default());
    option.parsers.unshift(new DETimeUnitRelativeFormatParser_1.default());
    return option;
}
function createConfiguration(strictMode = true, littleEndian = true) {
    return (0, configurations_1.includeCommonConfiguration)({
        parsers: [
            new ISOFormatParser_1.default(),
            new SlashDateFormatParser_1.default(littleEndian),
            new DETimeExpressionParser_1.default(),
            new DESpecificTimeExpressionParser_1.default(),
            new DEMonthNameLittleEndianParser_1.default(),
            new DEWeekdayParser_1.default(),
            new DETimeUnitWithinFormatParser_1.default(),
        ],
        refiners: [new DEMergeDateRangeRefiner_1.default(), new DEMergeDateTimeRefiner_1.default()],
    }, strictMode);
}
//# sourceMappingURL=index.js.map