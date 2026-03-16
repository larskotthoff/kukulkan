import { Weekday } from "../types.js";
import { ParsingComponents, ReferenceWithTimezone } from "../results.js";
export declare function createParsingComponentsAtWeekday(reference: ReferenceWithTimezone, weekday: Weekday, modifier?: "this" | "next" | "last"): ParsingComponents;
export declare function getDaysToWeekday(refDate: Date, weekday: Weekday, modifier?: "this" | "next" | "last"): number;
export declare function getDaysToWeekdayClosest(refDate: Date, weekday: Weekday): number;
export declare function getDaysForwardToWeekday(refDate: Date, weekday: Weekday): number;
export declare function getBackwardDaysToWeekday(refDate: Date, weekday: Weekday): number;
