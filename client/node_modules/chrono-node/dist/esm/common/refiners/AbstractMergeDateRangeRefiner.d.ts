import { ParsingResult } from "../../results.js";
import { MergingRefiner } from "../abstractRefiners.js";
export default abstract class AbstractMergeDateRangeRefiner extends MergingRefiner {
    abstract patternBetween(): RegExp;
    shouldMergeResults(textBetween: any, currentResult: any, nextResult: any): boolean;
    mergeResults(textBetween: any, fromResult: any, toResult: any): ParsingResult;
}
