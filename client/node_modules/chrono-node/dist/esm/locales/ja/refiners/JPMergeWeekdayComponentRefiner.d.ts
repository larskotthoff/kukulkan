import { MergingRefiner } from "../../../common/abstractRefiners.js";
import { ParsingResult } from "../../../results.js";
export default class JPMergeWeekdayComponentRefiner extends MergingRefiner {
    mergeResults(textBetween: string, currentResult: ParsingResult, nextResult: ParsingResult): ParsingResult;
    shouldMergeResults(textBetween: string, currentResult: ParsingResult, nextResult: ParsingResult): boolean;
}
