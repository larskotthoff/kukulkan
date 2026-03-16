import { ParsingContext } from "../../../chrono";
import { AbstractParserWithLeftBoundaryChecking } from "./AbstractParserWithWordBoundaryChecking";
export default class UkMonthNameParser extends AbstractParserWithLeftBoundaryChecking {
    innerPatternString(context: ParsingContext): string;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): import("..").ParsingResult;
}
