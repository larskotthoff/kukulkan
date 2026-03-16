import { ParsingContext } from "../../../chrono";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";
export default class ENYearMonthDayParser extends AbstractParserWithWordBoundaryChecking {
    private strictMonthDateOrder;
    constructor(strictMonthDateOrder: boolean);
    innerPattern(): RegExp;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): {
        day: number;
        month: number;
        year: number;
    };
}
