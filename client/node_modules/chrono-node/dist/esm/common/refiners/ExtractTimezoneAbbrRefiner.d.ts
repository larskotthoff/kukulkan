import { ParsingContext, Refiner } from "../../chrono.js";
import { TimezoneAbbrMap } from "../../types.js";
import { ParsingResult } from "../../results.js";
export default class ExtractTimezoneAbbrRefiner implements Refiner {
    private readonly timezoneOverrides?;
    constructor(timezoneOverrides?: TimezoneAbbrMap);
    refine(context: ParsingContext, results: ParsingResult[]): ParsingResult[];
}
