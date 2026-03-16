import { ParsingContext, Refiner } from "../../chrono";
import { TimezoneAbbrMap } from "../../types";
import { ParsingResult } from "../../results";
export default class ExtractTimezoneAbbrRefiner implements Refiner {
    private readonly timezoneOverrides?;
    constructor(timezoneOverrides?: TimezoneAbbrMap);
    refine(context: ParsingContext, results: ParsingResult[]): ParsingResult[];
}
