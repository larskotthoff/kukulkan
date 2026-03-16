import { ParsingContext } from "../../../chrono.js";
import { AbstractParserWithLeftBoundaryChecking } from "./AbstractParserWithWordBoundaryChecking.js";
export default class RUMonthNameParser extends AbstractParserWithLeftBoundaryChecking {
    innerPatternString(context: ParsingContext): string;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): import("../index.js").ParsingResult;
}
