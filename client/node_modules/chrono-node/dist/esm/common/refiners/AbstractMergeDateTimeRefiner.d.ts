import { MergingRefiner } from "../abstractRefiners.js";
import { ParsingResult } from "../../results.js";
export default abstract class AbstractMergeDateTimeRefiner extends MergingRefiner {
    abstract patternBetween(): RegExp;
    shouldMergeResults(textBetween: string, currentResult: ParsingResult, nextResult: ParsingResult): boolean;
    mergeResults(textBetween: string, currentResult: ParsingResult, nextResult: ParsingResult): ParsingResult;
}
