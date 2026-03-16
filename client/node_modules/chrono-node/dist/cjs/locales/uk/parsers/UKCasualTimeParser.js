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
const references = __importStar(require("../../../common/casualReferences"));
const dayjs_1 = require("../../../utils/dayjs");
const dayjs_2 = __importDefault(require("dayjs"));
const AbstractParserWithWordBoundaryChecking_1 = require("./AbstractParserWithWordBoundaryChecking");
class UKCasualTimeParser extends AbstractParserWithWordBoundaryChecking_1.AbstractParserWithLeftRightBoundaryChecking {
    innerPatternString(context) {
        return `(зараз|минулого\\s*вечора|минулої\\s*ночі|наступної\\s*ночі|сьогодні\\s*вночі|цієї\\s*ночі|цього ранку|вранці|ранку|зранку|опівдні|ввечері|вечора|опівночі|вночі)`;
    }
    innerExtract(context, match) {
        let targetDate = (0, dayjs_2.default)(context.reference.instant);
        const lowerText = match[0].toLowerCase();
        const component = context.createParsingComponents();
        if (lowerText === "зараз") {
            return references.now(context.reference);
        }
        if (lowerText === "ввечері" || lowerText === "вечора") {
            return references.evening(context.reference);
        }
        if (lowerText.endsWith("вранці") || lowerText.endsWith("ранку") || lowerText.endsWith("зранку")) {
            return references.morning(context.reference);
        }
        if (lowerText.endsWith("опівдні")) {
            return references.noon(context.reference);
        }
        if (lowerText.match(/минулої\s*ночі/)) {
            return references.lastNight(context.reference);
        }
        if (lowerText.match(/минулого\s*вечора/)) {
            return references.yesterdayEvening(context.reference);
        }
        if (lowerText.match(/наступної\s*ночі/)) {
            const daysToAdd = targetDate.hour() < 22 ? 1 : 2;
            targetDate = targetDate.add(daysToAdd, "day");
            (0, dayjs_1.assignSimilarDate)(component, targetDate);
            component.imply("hour", 1);
        }
        if (lowerText.match(/цієї\s*ночі/)) {
            return references.midnight(context.reference);
        }
        if (lowerText.endsWith("опівночі") || lowerText.endsWith("вночі")) {
            return references.midnight(context.reference);
        }
        return component;
    }
}
exports.default = UKCasualTimeParser;
//# sourceMappingURL=UKCasualTimeParser.js.map