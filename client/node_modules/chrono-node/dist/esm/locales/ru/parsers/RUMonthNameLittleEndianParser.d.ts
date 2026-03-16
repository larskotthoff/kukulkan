import { ParsingContext } from "../../../chrono.js";
import { ParsingResult } from "../../../results.js";
import { AbstractParserWithLeftRightBoundaryChecking } from "./AbstractParserWithWordBoundaryChecking.js";
export default class RUMonthNameLittleEndianParser extends AbstractParserWithLeftRightBoundaryChecking {
    innerPatternString(context: ParsingContext): string;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): ParsingResult;
}
