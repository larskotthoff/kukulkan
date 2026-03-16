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
const ESWeekdayParser_1 = __importDefault(require("./parsers/ESWeekdayParser"));
const ESTimeExpressionParser_1 = __importDefault(require("./parsers/ESTimeExpressionParser"));
const ESMergeDateTimeRefiner_1 = __importDefault(require("./refiners/ESMergeDateTimeRefiner"));
const ESMergeDateRangeRefiner_1 = __importDefault(require("./refiners/ESMergeDateRangeRefiner"));
const ESMonthNameLittleEndianParser_1 = __importDefault(require("./parsers/ESMonthNameLittleEndianParser"));
const ESCasualDateParser_1 = __importDefault(require("./parsers/ESCasualDateParser"));
const ESCasualTimeParser_1 = __importDefault(require("./parsers/ESCasualTimeParser"));
const ESTimeUnitWithinFormatParser_1 = __importDefault(require("./parsers/ESTimeUnitWithinFormatParser"));
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
    option.parsers.push(new ESCasualDateParser_1.default());
    option.parsers.push(new ESCasualTimeParser_1.default());
    return option;
}
function createConfiguration(strictMode = true, littleEndian = true) {
    return (0, configurations_1.includeCommonConfiguration)({
        parsers: [
            new SlashDateFormatParser_1.default(littleEndian),
            new ESWeekdayParser_1.default(),
            new ESTimeExpressionParser_1.default(),
            new ESMonthNameLittleEndianParser_1.default(),
            new ESTimeUnitWithinFormatParser_1.default(),
        ],
        refiners: [new ESMergeDateTimeRefiner_1.default(), new ESMergeDateRangeRefiner_1.default()],
    }, strictMode);
}
//# sourceMappingURL=index.js.map