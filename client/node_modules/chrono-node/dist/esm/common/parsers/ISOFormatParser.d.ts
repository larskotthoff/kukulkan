import { ParsingContext } from "../../chrono.js";
import { AbstractParserWithWordBoundaryChecking } from "./AbstractParserWithWordBoundary.js";
export default class ISOFormatParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(): RegExp;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): import("../../index.js").ParsingComponents;
}
