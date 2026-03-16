import { ParsingContext } from "../../../chrono";
import { ParsingResult } from "../../../results";
import { AbstractParserWithLeftRightBoundaryChecking } from "./AbstractParserWithWordBoundaryChecking";
export default class UKMonthNameLittleEndianParser extends AbstractParserWithLeftRightBoundaryChecking {
    innerPatternString(context: ParsingContext): string;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): ParsingResult;
}
