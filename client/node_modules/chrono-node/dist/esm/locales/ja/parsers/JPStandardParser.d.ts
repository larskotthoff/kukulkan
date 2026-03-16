import { Parser, ParsingContext } from "../../../chrono.js";
export default class JPStandardParser implements Parser {
    pattern(): RegExp;
    extract(context: ParsingContext, match: RegExpMatchArray): import("../index.js").ParsingComponents;
}
