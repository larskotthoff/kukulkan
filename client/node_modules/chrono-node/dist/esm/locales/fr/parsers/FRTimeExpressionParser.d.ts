import { AbstractTimeExpressionParser } from "../../../common/parsers/AbstractTimeExpressionParser.js";
import { ParsingComponents } from "../../../results.js";
import { ParsingContext } from "../../../chrono.js";
export default class FRTimeExpressionParser extends AbstractTimeExpressionParser {
    primaryPrefix(): string;
    followingPhase(): string;
    extractPrimaryTimeComponents(context: ParsingContext, match: RegExpMatchArray): ParsingComponents | null;
}
