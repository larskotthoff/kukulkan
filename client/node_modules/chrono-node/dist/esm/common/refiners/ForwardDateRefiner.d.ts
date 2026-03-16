import { ParsingContext, Refiner } from "../../chrono.js";
import { ParsingResult } from "../../results.js";
export default class ForwardDateRefiner implements Refiner {
    refine(context: ParsingContext, results: ParsingResult[]): ParsingResult[];
}
