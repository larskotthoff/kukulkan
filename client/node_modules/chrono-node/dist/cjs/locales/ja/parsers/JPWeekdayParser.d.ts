import { ParsingContext, Parser } from "../../../chrono";
import { ParsingComponents } from "../../../results";
export default class JPWeekdayParser implements Parser {
    pattern(): RegExp;
    extract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents;
}
