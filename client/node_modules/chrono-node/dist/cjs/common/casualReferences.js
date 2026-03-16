"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.now = now;
exports.today = today;
exports.yesterday = yesterday;
exports.theDayBefore = theDayBefore;
exports.tomorrow = tomorrow;
exports.theDayAfter = theDayAfter;
exports.tonight = tonight;
exports.lastNight = lastNight;
exports.evening = evening;
exports.yesterdayEvening = yesterdayEvening;
exports.midnight = midnight;
exports.morning = morning;
exports.afternoon = afternoon;
exports.noon = noon;
const results_1 = require("../results");
const dayjs_1 = __importDefault(require("dayjs"));
const dayjs_2 = require("../utils/dayjs");
const types_1 = require("../types");
function now(reference) {
    const targetDate = (0, dayjs_1.default)(reference.getDateWithAdjustedTimezone());
    const component = new results_1.ParsingComponents(reference, {});
    (0, dayjs_2.assignSimilarDate)(component, targetDate);
    (0, dayjs_2.assignSimilarTime)(component, targetDate);
    component.assign("timezoneOffset", reference.getTimezoneOffset());
    component.addTag("casualReference/now");
    return component;
}
function today(reference) {
    const targetDate = (0, dayjs_1.default)(reference.getDateWithAdjustedTimezone());
    const component = new results_1.ParsingComponents(reference, {});
    (0, dayjs_2.assignSimilarDate)(component, targetDate);
    (0, dayjs_2.implySimilarTime)(component, targetDate);
    component.addTag("casualReference/today");
    return component;
}
function yesterday(reference) {
    return theDayBefore(reference, 1).addTag("casualReference/yesterday");
}
function theDayBefore(reference, numDay) {
    return theDayAfter(reference, -numDay);
}
function tomorrow(reference) {
    return theDayAfter(reference, 1).addTag("casualReference/tomorrow");
}
function theDayAfter(reference, nDays) {
    let targetDate = (0, dayjs_1.default)(reference.getDateWithAdjustedTimezone());
    const component = new results_1.ParsingComponents(reference, {});
    targetDate = targetDate.add(nDays, "day");
    (0, dayjs_2.assignSimilarDate)(component, targetDate);
    (0, dayjs_2.implySimilarTime)(component, targetDate);
    return component;
}
function tonight(reference, implyHour = 22) {
    const targetDate = (0, dayjs_1.default)(reference.getDateWithAdjustedTimezone());
    const component = new results_1.ParsingComponents(reference, {});
    (0, dayjs_2.assignSimilarDate)(component, targetDate);
    component.imply("hour", implyHour);
    component.imply("meridiem", types_1.Meridiem.PM);
    component.addTag("casualReference/tonight");
    return component;
}
function lastNight(reference, implyHour = 0) {
    let targetDate = (0, dayjs_1.default)(reference.getDateWithAdjustedTimezone());
    const component = new results_1.ParsingComponents(reference, {});
    if (targetDate.hour() < 6) {
        targetDate = targetDate.add(-1, "day");
    }
    (0, dayjs_2.assignSimilarDate)(component, targetDate);
    component.imply("hour", implyHour);
    return component;
}
function evening(reference, implyHour = 20) {
    const component = new results_1.ParsingComponents(reference, {});
    component.imply("meridiem", types_1.Meridiem.PM);
    component.imply("hour", implyHour);
    component.addTag("casualReference/evening");
    return component;
}
function yesterdayEvening(reference, implyHour = 20) {
    let targetDate = (0, dayjs_1.default)(reference.getDateWithAdjustedTimezone());
    const component = new results_1.ParsingComponents(reference, {});
    targetDate = targetDate.add(-1, "day");
    (0, dayjs_2.assignSimilarDate)(component, targetDate);
    component.imply("hour", implyHour);
    component.imply("meridiem", types_1.Meridiem.PM);
    component.addTag("casualReference/yesterday");
    component.addTag("casualReference/evening");
    return component;
}
function midnight(reference) {
    const component = new results_1.ParsingComponents(reference, {});
    const targetDate = (0, dayjs_1.default)(reference.getDateWithAdjustedTimezone());
    if (targetDate.hour() > 2) {
        (0, dayjs_2.implyTheNextDay)(component, targetDate);
    }
    component.assign("hour", 0);
    component.imply("minute", 0);
    component.imply("second", 0);
    component.imply("millisecond", 0);
    component.addTag("casualReference/midnight");
    return component;
}
function morning(reference, implyHour = 6) {
    const component = new results_1.ParsingComponents(reference, {});
    component.imply("meridiem", types_1.Meridiem.AM);
    component.imply("hour", implyHour);
    component.imply("minute", 0);
    component.imply("second", 0);
    component.imply("millisecond", 0);
    component.addTag("casualReference/morning");
    return component;
}
function afternoon(reference, implyHour = 15) {
    const component = new results_1.ParsingComponents(reference, {});
    component.imply("meridiem", types_1.Meridiem.PM);
    component.imply("hour", implyHour);
    component.imply("minute", 0);
    component.imply("second", 0);
    component.imply("millisecond", 0);
    component.addTag("casualReference/afternoon");
    return component;
}
function noon(reference) {
    const component = new results_1.ParsingComponents(reference, {});
    component.imply("meridiem", types_1.Meridiem.AM);
    component.assign("hour", 12);
    component.imply("minute", 0);
    component.imply("second", 0);
    component.imply("millisecond", 0);
    component.addTag("casualReference/noon");
    return component;
}
//# sourceMappingURL=casualReferences.js.map