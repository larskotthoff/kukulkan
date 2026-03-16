import { WEEKDAY_DICTIONARY } from "../constants.js";
import { matchAnyPattern } from "../../../utils/pattern.js";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
import { createParsingComponentsAtWeekday } from "../../../calculation/weekdays.js";
const PATTERN = new RegExp("(?:(?:\\,|\\(|\\（)\\s*)?" +
    "(?:il\\s*?)?" +
    "(?:(questa|l'ultima|scorsa|prossima)\\s*)?" +
    `(${matchAnyPattern(WEEKDAY_DICTIONARY)})` +
    "(?:\\s*(?:\\,|\\)|\\）))?" +
    "(?:\\s*(questa|l'ultima|scorsa|prossima)\\s*settimana)?" +
    "(?=\\W|$)", "i");
const PREFIX_GROUP = 1;
const WEEKDAY_GROUP = 2;
const POSTFIX_GROUP = 3;
export default class ITWeekdayParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern() {
        return PATTERN;
    }
    innerExtract(context, match) {
        const dayOfWeek = match[WEEKDAY_GROUP].toLowerCase();
        const weekday = WEEKDAY_DICTIONARY[dayOfWeek];
        const prefix = match[PREFIX_GROUP];
        const postfix = match[POSTFIX_GROUP];
        let modifierWord = prefix || postfix;
        modifierWord = modifierWord || "";
        modifierWord = modifierWord.toLowerCase();
        let modifier = null;
        if (modifierWord == "ultima" || modifierWord == "scorsa") {
            modifier = "ultima";
        }
        else if (modifierWord == "prossima") {
            modifier = "prossima";
        }
        else if (modifierWord == "questa") {
            modifier = "questa";
        }
        return createParsingComponentsAtWeekday(context.reference, weekday, modifier);
    }
}
//# sourceMappingURL=ITWeekdayParser.js.map