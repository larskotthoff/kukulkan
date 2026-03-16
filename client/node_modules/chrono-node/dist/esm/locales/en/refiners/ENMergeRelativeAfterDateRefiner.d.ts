import { MergingRefiner } from "../../../common/abstractRefiners.js";
import { ParsingResult } from "../../../results.js";
export default class ENMergeRelativeAfterDateRefiner extends MergingRefiner {
    shouldMergeResults(textBetween: string, currentResult: ParsingResult, nextResult: ParsingResult): boolean;
    mergeResults(textBetween: string, currentResult: ParsingResult, nextResult: ParsingResult, context: any): ParsingResult;
}
