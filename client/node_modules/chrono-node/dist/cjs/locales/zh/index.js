"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strict = exports.casual = exports.Weekday = exports.Meridiem = exports.ReferenceWithTimezone = exports.ParsingComponents = exports.ParsingResult = exports.Chrono = exports.hans = exports.hant = void 0;
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
const ExtractTimezoneOffsetRefiner_1 = __importDefault(require("../../common/refiners/ExtractTimezoneOffsetRefiner"));
const ZHHansDateParser_1 = __importDefault(require("./hans/parsers/ZHHansDateParser"));
const ZHHansDeadlineFormatParser_1 = __importDefault(require("./hans/parsers/ZHHansDeadlineFormatParser"));
const ZHHansRelationWeekdayParser_1 = __importDefault(require("./hans/parsers/ZHHansRelationWeekdayParser"));
const ZHHansTimeExpressionParser_1 = __importDefault(require("./hans/parsers/ZHHansTimeExpressionParser"));
const ZHHansWeekdayParser_1 = __importDefault(require("./hans/parsers/ZHHansWeekdayParser"));
const ZHHantCasualDateParser_1 = __importDefault(require("./hant/parsers/ZHHantCasualDateParser"));
const ZHHantDateParser_1 = __importDefault(require("./hant/parsers/ZHHantDateParser"));
const ZHHantDeadlineFormatParser_1 = __importDefault(require("./hant/parsers/ZHHantDeadlineFormatParser"));
const ZHHantRelationWeekdayParser_1 = __importDefault(require("./hant/parsers/ZHHantRelationWeekdayParser"));
const ZHHantTimeExpressionParser_1 = __importDefault(require("./hant/parsers/ZHHantTimeExpressionParser"));
const ZHHantWeekdayParser_1 = __importDefault(require("./hant/parsers/ZHHantWeekdayParser"));
const ZHHantMergeDateRangeRefiner_1 = __importDefault(require("./hant/refiners/ZHHantMergeDateRangeRefiner"));
const ZHHantMergeDateTimeRefiner_1 = __importDefault(require("./hant/refiners/ZHHantMergeDateTimeRefiner"));
exports.hant = __importStar(require("./hant"));
exports.hans = __importStar(require("./hans"));
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
            new ZHHansDateParser_1.default(),
            new ZHHantRelationWeekdayParser_1.default(),
            new ZHHansRelationWeekdayParser_1.default(),
            new ZHHantWeekdayParser_1.default(),
            new ZHHansWeekdayParser_1.default(),
            new ZHHantTimeExpressionParser_1.default(),
            new ZHHansTimeExpressionParser_1.default(),
            new ZHHantDeadlineFormatParser_1.default(),
            new ZHHansDeadlineFormatParser_1.default(),
        ],
        refiners: [new ZHHantMergeDateRangeRefiner_1.default(), new ZHHantMergeDateTimeRefiner_1.default()],
    });
    configuration.refiners = configuration.refiners.filter((refiner) => !(refiner instanceof ExtractTimezoneOffsetRefiner_1.default));
    return configuration;
}
//# sourceMappingURL=index.js.map