import { ParsingContext } from "../../../chrono.js";
import { ParsingComponents } from "../../../results.js";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
export default class NLTimeUnitLaterFormatParser extends AbstractParserWithWordBoundaryChecking {
    private strictMode;
    constructor(strictMode: boolean);
    innerPattern(): RegExp;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents;
}
