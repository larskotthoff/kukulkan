import { Timeunit } from "../types";
export type TimeunitShorten = "y" | "mo" | "M" | "w" | "d" | "h" | "m" | "s" | "ms";
export type TimeunitSpecial = "quarter";
export type Duration = {
    [c in Timeunit | TimeunitSpecial | TimeunitShorten]?: number;
};
export declare function addDuration(ref: Date, duration: Duration): Date;
export declare function reverseDuration(duration: Duration): Duration;
