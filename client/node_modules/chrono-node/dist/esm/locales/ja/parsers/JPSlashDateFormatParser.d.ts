import { Parser, ParsingContext } from "../../../chrono.js";
import { ParsingComponents } from "../../../results.js";
export default class JPSlashDateFormatParser implements Parser {
    pattern(): RegExp;
    extract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents;
}
