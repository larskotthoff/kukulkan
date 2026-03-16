import { ParsingContext } from "../../chrono";
import { AbstractParserWithWordBoundaryChecking } from "./AbstractParserWithWordBoundary";
export default class ISOFormatParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(): RegExp;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): import("../..").ParsingComponents;
}
