export interface ParsingOption {
    forwardDate?: boolean;
    timezones?: TimezoneAbbrMap;
}
export interface AmbiguousTimezoneMap {
    timezoneOffsetDuringDst: number;
    timezoneOffsetNonDst: number;
    dstStart: (year: number) => Date;
    dstEnd: (year: number) => Date;
}
export type TimezoneAbbrMap = {
    [key: string]: number | AmbiguousTimezoneMap;
};
export interface ParsingReference {
    instant?: Date;
    timezone?: string | number;
}
export interface ParsedResult {
    readonly refDate: Date;
    readonly index: number;
    readonly text: string;
    readonly start: ParsedComponents;
    readonly end?: ParsedComponents;
    date(): Date;
    tags(): Set<string>;
}
export interface ParsedComponents {
    isCertain(component: Component): boolean;
    get(component: Component): number | null;
    date(): Date;
    tags(): Set<string>;
}
export type Component = "year" | "month" | "day" | "weekday" | "hour" | "minute" | "second" | "millisecond" | "meridiem" | "timezoneOffset";
export type Timeunit = "year" | "month" | "week" | "day" | "hour" | "minute" | "second" | "millisecond";
export declare enum Meridiem {
    AM = 0,
    PM = 1
}
export declare enum Weekday {
    SUNDAY = 0,
    MONDAY = 1,
    TUESDAY = 2,
    WEDNESDAY = 3,
    THURSDAY = 4,
    FRIDAY = 5,
    SATURDAY = 6
}
export declare enum Month {
    JANUARY = 1,
    FEBRUARY = 2,
    MARCH = 3,
    APRIL = 4,
    MAY = 5,
    JUNE = 6,
    JULY = 7,
    AUGUST = 8,
    SEPTEMBER = 9,
    OCTOBER = 10,
    NOVEMBER = 11,
    DECEMBER = 12
}
