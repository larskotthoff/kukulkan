import { Parser, ParsingContext } from "../../chrono.js";
import { ParsingResult } from "../../results.js";
export default class SlashDateFormatParser implements Parser {
    groupNumberMonth: number;
    groupNumberDay: number;
    constructor(littleEndian: boolean);
    pattern(): RegExp;
    extract(context: ParsingContext, match: RegExpMatchArray): ParsingResult;
}
