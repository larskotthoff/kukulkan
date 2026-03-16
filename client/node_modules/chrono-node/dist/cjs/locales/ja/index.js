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
const JPStandardParser_1 = __importDefault(require("./parsers/JPStandardParser"));
const JPMergeDateRangeRefiner_1 = __importDefault(require("./refiners/JPMergeDateRangeRefiner"));
const JPCasualDateParser_1 = __importDefault(require("./parsers/JPCasualDateParser"));
const JPWeekdayParser_1 = __importDefault(require("./parsers/JPWeekdayParser"));
const JPSlashDateFormatParser_1 = __importDefault(require("./parsers/JPSlashDateFormatParser"));
const JPTimeExpressionParser_1 = __importDefault(require("./parsers/JPTimeExpressionParser"));
const JPMergeDateTimeRefiner_1 = __importDefault(require("./refiners/JPMergeDateTimeRefiner"));
const chrono_1 = require("../../chrono");
Object.defineProperty(exports, "Chrono", { enumerable: true, get: function () { return chrono_1.Chrono; } });
const results_1 = require("../../results");
Object.defineProperty(exports, "ParsingResult", { enumerable: true, get: function () { return results_1.ParsingResult; } });
Object.defineProperty(exports, "ParsingComponents", { enumerable: true, get: function () { return results_1.ParsingComponents; } });
Object.defineProperty(exports, "ReferenceWithTimezone", { enumerable: true, get: function () { return results_1.ReferenceWithTimezone; } });
const types_1 = require("../../types");
Object.defineProperty(exports, "Meridiem", { enumerable: true, get: function () { return types_1.Meridiem; } });
Object.defineProperty(exports, "Weekday", { enumerable: true, get: function () { return types_1.Weekday; } });
const JPMergeWeekdayComponentRefiner_1 = __importDefault(require("./refiners/JPMergeWeekdayComponentRefiner"));
const JPWeekdayWithParenthesesParser_1 = __importDefault(require("./parsers/JPWeekdayWithParenthesesParser"));
const configurations_1 = require("../../configurations");
const MergeWeekdayComponentRefiner_1 = __importDefault(require("../../common/refiners/MergeWeekdayComponentRefiner"));
exports.casual = new chrono_1.Chrono(createCasualConfiguration());
exports.strict = new chrono_1.Chrono(createConfiguration(true));
function parse(text, ref, option) {
    return exports.casual.parse(text, ref, option);
}
function parseDate(text, ref, option) {
    return exports.casual.parseDate(text, ref, option);
}
function createCasualConfiguration() {
    const option = createConfiguration(false);
    option.parsers.unshift(new JPCasualDateParser_1.default());
    return option;
}
function createConfiguration(strictMode = true) {
    const configuration = (0, configurations_1.includeCommonConfiguration)({
        parsers: [
            new JPStandardParser_1.default(),
            new JPWeekdayParser_1.default(),
            new JPWeekdayWithParenthesesParser_1.default(),
            new JPSlashDateFormatParser_1.default(),
            new JPTimeExpressionParser_1.default(),
        ],
        refiners: [
            new JPMergeWeekdayComponentRefiner_1.default(),
            new JPMergeDateTimeRefiner_1.default(),
            new JPMergeDateRangeRefiner_1.default(),
        ],
    }, strictMode);
    configuration.refiners = configuration.refiners.filter((refiner) => !(refiner instanceof MergeWeekdayComponentRefiner_1.default));
    return configuration;
}
//# sourceMappingURL=index.js.map