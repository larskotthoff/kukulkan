import { ParsingContext } from "../../../chrono";
import { ParsingComponents, ParsingResult } from "../../../results";
import { AbstractTimeExpressionParser } from "../../../common/parsers/AbstractTimeExpressionParser";
export default class ENTimeExpressionParser extends AbstractTimeExpressionParser {
    constructor(strictMode: any);
    followingPhase(): string;
    primaryPrefix(): string;
    primarySuffix(): string;
    extractPrimaryTimeComponents(context: ParsingContext, match: RegExpMatchArray): null | ParsingComponents;
    extractFollowingTimeComponents(context: ParsingContext, match: RegExpMatchArray, result: ParsingResult): ParsingComponents | null;
}
