import { ParsingContext, Refiner } from "../../../chrono.js";
import { ParsingResult } from "../../../results.js";
export default class ENExtractYearSuffixRefiner implements Refiner {
    refine(context: ParsingContext, results: ParsingResult[]): ParsingResult[];
}
