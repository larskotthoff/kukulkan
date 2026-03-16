import { ParsingComponents } from "../results.js";
import dayjs from "dayjs";
import { assignSimilarDate, assignSimilarTime, implySimilarTime, implyTheNextDay, } from "../utils/dayjs.js";
import { Meridiem } from "../types.js";
export function now(reference) {
    const targetDate = dayjs(reference.getDateWithAdjustedTimezone());
    const component = new ParsingComponents(reference, {});
    assignSimilarDate(component, targetDate);
    assignSimilarTime(component, targetDate);
    component.assign("timezoneOffset", reference.getTimezoneOffset());
    component.addTag("casualReference/now");
    return component;
}
export function today(reference) {
    const targetDate = dayjs(reference.getDateWithAdjustedTimezone());
    const component = new ParsingComponents(reference, {});
    assignSimilarDate(component, targetDate);
    implySimilarTime(component, targetDate);
    component.addTag("casualReference/today");
    return component;
}
export function yesterday(reference) {
    return theDayBefore(reference, 1).addTag("casualReference/yesterday");
}
export function theDayBefore(reference, numDay) {
    return theDayAfter(reference, -numDay);
}
export function tomorrow(reference) {
    return theDayAfter(reference, 1).addTag("casualReference/tomorrow");
}
export function theDayAfter(reference, nDays) {
    let targetDate = dayjs(reference.getDateWithAdjustedTimezone());
    const component = new ParsingComponents(reference, {});
    targetDate = targetDate.add(nDays, "day");
    assignSimilarDate(component, targetDate);
    implySimilarTime(component, targetDate);
    return component;
}
export function tonight(reference, implyHour = 22) {
    const targetDate = dayjs(reference.getDateWithAdjustedTimezone());
    const component = new ParsingComponents(reference, {});
    assignSimilarDate(component, targetDate);
    component.imply("hour", implyHour);
    component.imply("meridiem", Meridiem.PM);
    component.addTag("casualReference/tonight");
    return component;
}
export function lastNight(reference, implyHour = 0) {
    let targetDate = dayjs(reference.getDateWithAdjustedTimezone());
    const component = new ParsingComponents(reference, {});
    if (targetDate.hour() < 6) {
        targetDate = targetDate.add(-1, "day");
    }
    assignSimilarDate(component, targetDate);
    component.imply("hour", implyHour);
    return component;
}
export function evening(reference, implyHour = 20) {
    const component = new ParsingComponents(reference, {});
    component.imply("meridiem", Meridiem.PM);
    component.imply("hour", implyHour);
    component.addTag("casualReference/evening");
    return component;
}
export function yesterdayEvening(reference, implyHour = 20) {
    let targetDate = dayjs(reference.getDateWithAdjustedTimezone());
    const component = new ParsingComponents(reference, {});
    targetDate = targetDate.add(-1, "day");
    assignSimilarDate(component, targetDate);
    component.imply("hour", implyHour);
    component.imply("meridiem", Meridiem.PM);
    component.addTag("casualReference/yesterday");
    component.addTag("casualReference/evening");
    return component;
}
export function midnight(reference) {
    const component = new ParsingComponents(reference, {});
    const targetDate = dayjs(reference.getDateWithAdjustedTimezone());
    if (targetDate.hour() > 2) {
        implyTheNextDay(component, targetDate);
    }
    component.assign("hour", 0);
    component.imply("minute", 0);
    component.imply("second", 0);
    component.imply("millisecond", 0);
    component.addTag("casualReference/midnight");
    return component;
}
export function morning(reference, implyHour = 6) {
    const component = new ParsingComponents(reference, {});
    component.imply("meridiem", Meridiem.AM);
    component.imply("hour", implyHour);
    component.imply("minute", 0);
    component.imply("second", 0);
    component.imply("millisecond", 0);
    component.addTag("casualReference/morning");
    return component;
}
export function afternoon(reference, implyHour = 15) {
    const component = new ParsingComponents(reference, {});
    component.imply("meridiem", Meridiem.PM);
    component.imply("hour", implyHour);
    component.imply("minute", 0);
    component.imply("second", 0);
    component.imply("millisecond", 0);
    component.addTag("casualReference/afternoon");
    return component;
}
export function noon(reference) {
    const component = new ParsingComponents(reference, {});
    component.imply("meridiem", Meridiem.AM);
    component.assign("hour", 12);
    component.imply("minute", 0);
    component.imply("second", 0);
    component.imply("millisecond", 0);
    component.addTag("casualReference/noon");
    return component;
}
//# sourceMappingURL=casualReferences.js.map