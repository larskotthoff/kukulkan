import { OpUnitType, QUnitType } from "dayjs";
import { TimeUnits } from "../../utils/timeunits";
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
export declare const YEAR_PATTERN = "(?:[1-9][0-9]{0,3}(?:\\s+(?:\u0433\u043E\u0434\u0443|\u0433\u043E\u0434\u0430|\u0433\u043E\u0434|\u0433|\u0433.))?\\s*(?:\u043D.\u044D.|\u0434\u043E \u043D.\u044D.|\u043D. \u044D.|\u0434\u043E \u043D. \u044D.)|[1-2][0-9]{3}(?:\\s+(?:\u0433\u043E\u0434\u0443|\u0433\u043E\u0434\u0430|\u0433\u043E\u0434|\u0433|\u0433.))?|[5-9][0-9](?:\\s+(?:\u0433\u043E\u0434\u0443|\u0433\u043E\u0434\u0430|\u0433\u043E\u0434|\u0433|\u0433.))?)";
export declare function parseYear(match: string): number;
export declare const TIME_UNITS_PATTERN: string;
export declare function parseTimeUnits(timeunitText: any): TimeUnits;
