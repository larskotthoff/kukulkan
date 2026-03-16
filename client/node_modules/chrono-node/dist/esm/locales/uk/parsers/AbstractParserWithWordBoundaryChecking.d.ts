import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
import { ParsingContext } from "../../../chrono.js";
export declare abstract class AbstractParserWithLeftBoundaryChecking extends AbstractParserWithWordBoundaryChecking {
    abstract innerPatternString(context: ParsingContext): string;
    patternLeftBoundary(): string;
    innerPattern(context: ParsingContext): RegExp;
    innerPatternHasChange(context: ParsingContext, currentInnerPattern: RegExp): boolean;
}
export declare abstract class AbstractParserWithLeftRightBoundaryChecking extends AbstractParserWithLeftBoundaryChecking {
    innerPattern(context: ParsingContext): RegExp;
}
