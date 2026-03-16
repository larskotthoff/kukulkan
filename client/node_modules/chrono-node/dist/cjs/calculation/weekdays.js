"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createParsingComponentsAtWeekday = createParsingComponentsAtWeekday;
exports.getDaysToWeekday = getDaysToWeekday;
exports.getDaysToWeekdayClosest = getDaysToWeekdayClosest;
exports.getDaysForwardToWeekday = getDaysForwardToWeekday;
exports.getBackwardDaysToWeekday = getBackwardDaysToWeekday;
const types_1 = require("../types");
const results_1 = require("../results");
const timeunits_1 = require("../utils/timeunits");
function createParsingComponentsAtWeekday(reference, weekday, modifier) {
    const refDate = reference.getDateWithAdjustedTimezone();
    const daysToWeekday = getDaysToWeekday(refDate, weekday, modifier);
    let components = new results_1.ParsingComponents(reference);
    components = (0, timeunits_1.addImpliedTimeUnits)(components, { "day": daysToWeekday });
    components.assign("weekday", weekday);
    return components;
}
function getDaysToWeekday(refDate, weekday, modifier) {
    const refWeekday = refDate.getDay();
    switch (modifier) {
        case "this":
            return getDaysForwardToWeekday(refDate, weekday);
        case "last":
            return getBackwardDaysToWeekday(refDate, weekday);
        case "next":
            if (refWeekday == types_1.Weekday.SUNDAY) {
                return weekday == types_1.Weekday.SUNDAY ? 7 : weekday;
            }
            if (refWeekday == types_1.Weekday.SATURDAY) {
                if (weekday == types_1.Weekday.SATURDAY)
                    return 7;
                if (weekday == types_1.Weekday.SUNDAY)
                    return 8;
                return 1 + weekday;
            }
            if (weekday < refWeekday && weekday != types_1.Weekday.SUNDAY) {
                return getDaysForwardToWeekday(refDate, weekday);
            }
            else {
                return getDaysForwardToWeekday(refDate, weekday) + 7;
            }
    }
    return getDaysToWeekdayClosest(refDate, weekday);
}
function getDaysToWeekdayClosest(refDate, weekday) {
    const backward = getBackwardDaysToWeekday(refDate, weekday);
    const forward = getDaysForwardToWeekday(refDate, weekday);
    return forward < -backward ? forward : backward;
}
function getDaysForwardToWeekday(refDate, weekday) {
    const refWeekday = refDate.getDay();
    let forwardCount = weekday - refWeekday;
    if (forwardCount < 0) {
        forwardCount += 7;
    }
    return forwardCount;
}
function getBackwardDaysToWeekday(refDate, weekday) {
    const refWeekday = refDate.getDay();
    let backwardCount = weekday - refWeekday;
    if (backwardCount >= 0) {
        backwardCount -= 7;
    }
    return backwardCount;
}
//# sourceMappingURL=weekdays.js.map