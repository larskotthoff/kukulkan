import { ParsingContext } from "../../../chrono.js";
import { ParsingComponents } from "../../../results.js";
import { AbstractTimeExpressionParser } from "../../../common/parsers/AbstractTimeExpressionParser.js";
export default class UKTimeExpressionParser extends AbstractTimeExpressionParser {
    constructor(strictMode: any);
    patternFlags(): string;
    primaryPatternLeftBoundary(): string;
    followingPhase(): string;
    primaryPrefix(): string;
    primarySuffix(): string;
    extractPrimaryTimeComponents(context: ParsingContext, match: RegExpMatchArray): null | ParsingComponents;
}
