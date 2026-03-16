import { MergingRefiner } from "../../../common/abstractRefiners.js";
import { ParsingResult } from "../../../results.js";
export default class ENMergeRelativeFollowByDateRefiner extends MergingRefiner {
    patternBetween(): RegExp;
    shouldMergeResults(textBetween: string, currentResult: ParsingResult, nextResult: ParsingResult): boolean;
    mergeResults(textBetween: string, currentResult: ParsingResult, nextResult: ParsingResult): ParsingResult;
}
