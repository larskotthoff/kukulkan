import { TimezoneAbbrMap, Weekday, Month } from "./types.js";
export declare const TIMEZONE_ABBR_MAP: TimezoneAbbrMap;
export declare function getNthWeekdayOfMonth(year: number, month: Month, weekday: Weekday, n: 1 | 2 | 3 | 4, hour?: number): Date;
export declare function getLastWeekdayOfMonth(year: number, month: Month, weekday: Weekday, hour?: number): Date;
export declare function toTimezoneOffset(timezoneInput?: string | number, date?: Date, timezoneOverrides?: TimezoneAbbrMap): number | null;
