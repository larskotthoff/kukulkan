import { ParsingContext } from "../../../chrono.js";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
export default class ENCasualYearMonthDayParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(): RegExp;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): {
        day: number;
        month: number;
        year: number;
    };
}
