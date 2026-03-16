import { ParsingComponents } from "../results.js";
import dayjs from "dayjs";
export declare function assignTheNextDay(component: ParsingComponents, targetDayJs: dayjs.Dayjs): void;
export declare function implyTheNextDay(component: ParsingComponents, targetDayJs: dayjs.Dayjs): void;
export declare function assignSimilarDate(component: ParsingComponents, targetDayJs: dayjs.Dayjs): void;
export declare function assignSimilarTime(component: ParsingComponents, targetDayJs: dayjs.Dayjs): void;
export declare function implySimilarDate(component: ParsingComponents, targetDayJs: dayjs.Dayjs): void;
export declare function implySimilarTime(component: ParsingComponents, targetDayJs: dayjs.Dayjs): void;
