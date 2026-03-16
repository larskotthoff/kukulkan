import { MergingRefiner } from "../../../common/abstractRefiners";
import { ParsingResult } from "../../../results";
export default class JPMergeWeekdayComponentRefiner extends MergingRefiner {
    mergeResults(textBetween: string, currentResult: ParsingResult, nextResult: ParsingResult): ParsingResult;
    shouldMergeResults(textBetween: string, currentResult: ParsingResult, nextResult: ParsingResult): boolean;
}
