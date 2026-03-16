import { AbstractTimeExpressionParser } from "../../../common/parsers/AbstractTimeExpressionParser.js";
import { ParsingComponents } from "../../../results.js";
import { ParsingContext } from "../../../chrono.js";
export default class NLTimeExpressionParser extends AbstractTimeExpressionParser {
    primaryPrefix(): string;
    followingPhase(): string;
    primarySuffix(): string;
    extractPrimaryTimeComponents(context: ParsingContext, match: RegExpMatchArray): ParsingComponents | null;
}
