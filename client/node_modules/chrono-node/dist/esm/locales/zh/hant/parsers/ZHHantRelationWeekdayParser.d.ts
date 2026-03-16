import { ParsingContext } from "../../../../chrono.js";
import { AbstractParserWithWordBoundaryChecking } from "../../../../common/parsers/AbstractParserWithWordBoundary.js";
import { ParsingResult } from "../../../../results.js";
export default class ZHHantRelationWeekdayParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(): RegExp;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): ParsingResult;
}
