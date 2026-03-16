import { Parser, ParsingContext } from "../../chrono.js";
import { ParsingComponents, ParsingResult } from "../../results.js";
import { Component } from "../../types.js";
export declare abstract class AbstractParserWithWordBoundaryChecking implements Parser {
    abstract innerPattern(context: ParsingContext): RegExp;
    abstract innerExtract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents | ParsingResult | {
        [c in Component]?: number;
    } | null;
    innerPatternHasChange(context: ParsingContext, currentInnerPattern: RegExp): boolean;
    patternLeftBoundary(): string;
    private cachedInnerPattern?;
    private cachedPattern?;
    pattern(context: ParsingContext): RegExp;
    extract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents | ParsingResult | {
        day?: number;
        hour?: number;
        minute?: number;
        month?: number;
        second?: number;
        weekday?: number;
        year?: number;
        millisecond?: number;
        meridiem?: number;
        timezoneOffset?: number;
    };
}
