import { OpUnitType, QUnitType } from "dayjs";
import { TimeUnits } from "../../utils/timeunits.js";
export declare const REGEX_PARTS: {
    leftBoundary: string;
    rightBoundary: string;
    flags: string;
};
export declare const WEEKDAY_DICTIONARY: {
    [word: string]: number;
};
export declare const FULL_MONTH_NAME_DICTIONARY: {
    [word: string]: number;
};
export declare const MONTH_DICTIONARY: {
    [word: string]: number;
};
export declare const INTEGER_WORD_DICTIONARY: {
    [word: string]: number;
};
export declare const ORDINAL_WORD_DICTIONARY: {
    [word: string]: number;
};
export declare const TIME_UNIT_DICTIONARY: {
    [word: string]: OpUnitType | QUnitType;
};
export declare const NUMBER_PATTERN: string;
export declare function parseNumberPattern(match: string): number;
export declare const ORDINAL_NUMBER_PATTERN: string;
export declare function parseOrdinalNumberPattern(match: string): number;
export declare const YEAR_PATTERN = "(?:[1-9][0-9]{0,3}(?:\\s+(?:\u0440\u043E\u043A\u0443|\u0440\u0456\u043A|\u0440|\u0440.))?\\s*(?:\u043D.\u0435.|\u0434\u043E \u043D.\u0435.|\u043D. \u0435.|\u0434\u043E \u043D. \u0435.)|[1-2][0-9]{3}(?:\\s+(?:\u0440\u043E\u043A\u0443|\u0440\u0456\u043A|\u0440|\u0440.))?|[5-9][0-9](?:\\s+(?:\u0440\u043E\u043A\u0443|\u0440\u0456\u043A|\u0440|\u0440.))?)";
export declare function parseYearPattern(match: string): number;
export declare const TIME_UNITS_PATTERN: string;
export declare function parseTimeUnits(timeunitText: any): TimeUnits;
