import { Filter } from "../abstractRefiners.js";
import { ParsingResult } from "../../results.js";
export default class UnlikelyFormatFilter extends Filter {
    private strictMode;
    constructor(strictMode: boolean);
    isValid(context: any, result: ParsingResult): boolean;
    private isStrictModeValid;
}
