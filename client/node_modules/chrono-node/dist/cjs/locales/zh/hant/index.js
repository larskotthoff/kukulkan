"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strict = exports.casual = exports.hant = exports.Weekday = exports.Meridiem = exports.ReferenceWithTimezone = exports.ParsingComponents = exports.ParsingResult = exports.Chrono = void 0;
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
const ZHHantCasualDateParser_1 = __importDefault(require("./parsers/ZHHantCasualDateParser"));
const ZHHantDateParser_1 = __importDefault(require("./parsers/ZHHantDateParser"));
const ZHHantDeadlineFormatParser_1 = __importDefault(require("./parsers/ZHHantDeadlineFormatParser"));
const ZHHantRelationWeekdayParser_1 = __importDefault(require("./parsers/ZHHantRelationWeekdayParser"));
const ZHHantTimeExpressionParser_1 = __importDefault(require("./parsers/ZHHantTimeExpressionParser"));
const ZHHantWeekdayParser_1 = __importDefault(require("./parsers/ZHHantWeekdayParser"));
const ZHHantMergeDateRangeRefiner_1 = __importDefault(require("./refiners/ZHHantMergeDateRangeRefiner"));
const ZHHantMergeDateTimeRefiner_1 = __importDefault(require("./refiners/ZHHantMergeDateTimeRefiner"));
exports.hant = new chrono_1.Chrono(createCasualConfiguration());
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
    option.parsers.unshift(new ZHHantCasualDateParser_1.default());
    return option;
}
function createConfiguration() {
    const configuration = (0, configurations_1.includeCommonConfiguration)({
        parsers: [
            new ZHHantDateParser_1.default(),
            new ZHHantRelationWeekdayParser_1.default(),
            new ZHHantWeekdayParser_1.default(),
            new ZHHantTimeExpressionParser_1.default(),
            new ZHHantDeadlineFormatParser_1.default(),
        ],
        refiners: [new ZHHantMergeDateRangeRefiner_1.default(), new ZHHantMergeDateTimeRefiner_1.default()],
    });
    configuration.refiners = configuration.refiners.filter((refiner) => !(refiner instanceof ExtractTimezoneOffsetRefiner_1.default));
    return configuration;
}
//# sourceMappingURL=index.js.map