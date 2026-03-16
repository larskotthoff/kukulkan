import { ParsingContext, Parser } from "../../../chrono.js";
import { ParsingComponents } from "../../../results.js";
export default class JPWeekdayParser implements Parser {
    pattern(): RegExp;
    extract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents;
}
