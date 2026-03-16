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
const RUTimeUnitWithinFormatParser_1 = __importDefault(require("./parsers/RUTimeUnitWithinFormatParser"));
const RUMonthNameLittleEndianParser_1 = __importDefault(require("./parsers/RUMonthNameLittleEndianParser"));
const RUMonthNameParser_1 = __importDefault(require("./parsers/RUMonthNameParser"));
const RUTimeExpressionParser_1 = __importDefault(require("./parsers/RUTimeExpressionParser"));
const RUTimeUnitAgoFormatParser_1 = __importDefault(require("./parsers/RUTimeUnitAgoFormatParser"));
const RUMergeDateRangeRefiner_1 = __importDefault(require("./refiners/RUMergeDateRangeRefiner"));
const RUMergeDateTimeRefiner_1 = __importDefault(require("./refiners/RUMergeDateTimeRefiner"));
const configurations_1 = require("../../configurations");
const RUCasualDateParser_1 = __importDefault(require("./parsers/RUCasualDateParser"));
const RUCasualTimeParser_1 = __importDefault(require("./parsers/RUCasualTimeParser"));
const RUWeekdayParser_1 = __importDefault(require("./parsers/RUWeekdayParser"));
const RURelativeDateFormatParser_1 = __importDefault(require("./parsers/RURelativeDateFormatParser"));
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
const RUTimeUnitCasualRelativeFormatParser_1 = __importDefault(require("./parsers/RUTimeUnitCasualRelativeFormatParser"));
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
    option.parsers.unshift(new RUCasualDateParser_1.default());
    option.parsers.unshift(new RUCasualTimeParser_1.default());
    option.parsers.unshift(new RUMonthNameParser_1.default());
    option.parsers.unshift(new RURelativeDateFormatParser_1.default());
    option.parsers.unshift(new RUTimeUnitCasualRelativeFormatParser_1.default());
    return option;
}
function createConfiguration(strictMode = true) {
    return (0, configurations_1.includeCommonConfiguration)({
        parsers: [
            new SlashDateFormatParser_1.default(true),
            new RUTimeUnitWithinFormatParser_1.default(),
            new RUMonthNameLittleEndianParser_1.default(),
            new RUWeekdayParser_1.default(),
            new RUTimeExpressionParser_1.default(strictMode),
            new RUTimeUnitAgoFormatParser_1.default(),
        ],
        refiners: [new RUMergeDateTimeRefiner_1.default(), new RUMergeDateRangeRefiner_1.default()],
    }, strictMode);
}
//# sourceMappingURL=index.js.map