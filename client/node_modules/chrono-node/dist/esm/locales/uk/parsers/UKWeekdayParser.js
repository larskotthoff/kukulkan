import { WEEKDAY_DICTIONARY } from "../constants.js";
import { matchAnyPattern } from "../../../utils/pattern.js";
import { createParsingComponentsAtWeekday } from "../../../calculation/weekdays.js";
import { AbstractParserWithLeftRightBoundaryChecking } from "./AbstractParserWithWordBoundaryChecking.js";
const PREFIX_GROUP = 1;
const WEEKDAY_GROUP = 2;
const POSTFIX_GROUP = 3;
export default class UKWeekdayParser extends AbstractParserWithLeftRightBoundaryChecking {
    innerPatternString(context) {
        return (`(?:(?:,|\\(|（)\\s*)?` +
            `(?:в\\s*?)?` +
            `(?:у\\s*?)?` +
            `(?:(цей|минулого|минулий|попередній|попереднього|наступного|наступний|наступному)\\s*)?` +
            `(${matchAnyPattern(WEEKDAY_DICTIONARY)})` +
            `(?:\\s*(?:,|\\)|）))?` +
            `(?:\\s*(на|у|в)\\s*(цьому|минулому|наступному)\\s*тижні)?`);
    }
    innerExtract(context, match) {
        const dayOfWeek = match[WEEKDAY_GROUP].toLocaleLowerCase();
        const weekday = WEEKDAY_DICTIONARY[dayOfWeek];
        const prefix = match[PREFIX_GROUP];
        const postfix = match[POSTFIX_GROUP];
        let modifierWord = prefix || postfix;
        modifierWord = modifierWord || "";
        modifierWord = modifierWord.toLocaleLowerCase();
        let modifier = null;
        if (modifierWord == "минулого" ||
            modifierWord == "минулий" ||
            modifierWord == "попередній" ||
            modifierWord == "попереднього") {
            modifier = "last";
        }
        else if (modifierWord == "наступного" || modifierWord == "наступний") {
            modifier = "next";
        }
        else if (modifierWord == "цей" || modifierWord == "цього" || modifierWord == "цьому") {
            modifier = "this";
        }
        return createParsingComponentsAtWeekday(context.reference, weekday, modifier);
    }
}
//# sourceMappingURL=UKWeekdayParser.js.map