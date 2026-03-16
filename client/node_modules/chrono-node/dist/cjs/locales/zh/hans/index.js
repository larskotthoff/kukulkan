"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strict = exports.casual = exports.hans = exports.Weekday = exports.Meridiem = exports.ReferenceWithTimezone = exports.ParsingComponents = exports.ParsingResult = exports.Chrono = void 0;
exports.parse = parse;
exports.parseDate = parseDate;
exports.createCasualConfiguration = createCasualConfiguration;
exports.createConfiguration = createConfiguration;
const ExtractTimezoneOffsetRefiner_1 = __importDefault(require("../../../common/refiners/ExtractTimezoneOffsetRefiner"));
const configurations_1 = require("../../../configurations");
const chrono_1 = require("../../../chrono");
Object.defineProperty(exports, "Chrono", { enumerable: true, get: function () { return chrono_1.Chrono; } });
const results_1 = require("../../../results");
Object.defineProperty(exports, "ParsingResult", { enumerable: true, get: function () { return results_1.ParsingResult; } });
Object.defineProperty(exports, "ParsingComponents", { enumerable: true, get: function () { return results_1.ParsingComponents; } });
Object.defineProperty(exports, "ReferenceWithTimezone", { enumerable: true, get: function () { return results_1.ReferenceWithTimezone; } });
const types_1 = require("../../../types");
Object.defineProperty(exports, "Meridiem", { enumerable: true, get: function () { return types_1.Meridiem; } });
Object.defineProperty(exports, "Weekday", { enumerable: true, get: function () { return types_1.Weekday; } });
const ZHHansCasualDateParser_1 = __importDefault(require("./parsers/ZHHansCasualDateParser"));
const ZHHansDateParser_1 = __importDefault(require("./parsers/ZHHansDateParser"));
const ZHHansDeadlineFormatParser_1 = __importDefault(require("./parsers/ZHHansDeadlineFormatParser"));
const ZHHansRelationWeekdayParser_1 = __importDefault(require("./parsers/ZHHansRelationWeekdayParser"));
const ZHHansTimeExpressionParser_1 = __importDefault(require("./parsers/ZHHansTimeExpressionParser"));
const ZHHansWeekdayParser_1 = __importDefault(require("./parsers/ZHHansWeekdayParser"));
const ZHHansMergeDateRangeRefiner_1 = __importDefault(require("./refiners/ZHHansMergeDateRangeRefiner"));
const ZHHansMergeDateTimeRefiner_1 = __importDefault(require("./refiners/ZHHansMergeDateTimeRefiner"));
exports.hans = new chrono_1.Chrono(createCasualConfiguration());
exports.casual = new chrono_1.Chrono(createCasualConfiguration());
exports.strict = new chrono_1.Chrono(createConfiguration());
function parse(text, ref, option) {
    return exports.casual.parse(text, ref, option);
}
function parseDate(text, ref, option) {
    return exports.casual.parseDate(text, ref, option);
}
function createCasualConfiguration() {
    const option = createConfiguration();
    option.parsers.unshift(new ZHHansCasualDateParser_1.default());
    return option;
}
function createConfiguration() {
    const configuration = (0, configurations_1.includeCommonConfiguration)({
        parsers: [
            new ZHHansDateParser_1.default(),
            new ZHHansRelationWeekdayParser_1.default(),
            new ZHHansWeekdayParser_1.default(),
            new ZHHansTimeExpressionParser_1.default(),
            new ZHHansDeadlineFormatParser_1.default(),
        ],
        refiners: [new ZHHansMergeDateRangeRefiner_1.default(), new ZHHansMergeDateTimeRefiner_1.default()],
    });
    configuration.refiners = configuration.refiners.filter((refiner) => !(refiner instanceof ExtractTimezoneOffsetRefiner_1.default));
    return configuration;
}
//# sourceMappingURL=index.js.map