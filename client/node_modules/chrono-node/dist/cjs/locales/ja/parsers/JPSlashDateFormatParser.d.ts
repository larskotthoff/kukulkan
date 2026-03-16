import { Parser, ParsingContext } from "../../../chrono";
import { ParsingComponents } from "../../../results";
export default class JPSlashDateFormatParser implements Parser {
    pattern(): RegExp;
    extract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents;
}
