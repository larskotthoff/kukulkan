import { AbstractTimeExpressionParser } from "../../../common/parsers/AbstractTimeExpressionParser.js";
export default class ESTimeExpressionParser extends AbstractTimeExpressionParser {
    primaryPrefix(): string;
    followingPhase(): string;
}
