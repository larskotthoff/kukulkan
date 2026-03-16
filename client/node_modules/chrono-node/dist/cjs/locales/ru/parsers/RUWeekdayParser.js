"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const pattern_1 = require("../../../utils/pattern");
const weekdays_1 = require("../../../calculation/weekdays");
const AbstractParserWithWordBoundaryChecking_1 = require("./AbstractParserWithWordBoundaryChecking");
const PREFIX_GROUP = 1;
const WEEKDAY_GROUP = 2;
const POSTFIX_GROUP = 3;
class RUWeekdayParser extends AbstractParserWithWordBoundaryChecking_1.AbstractParserWithLeftRightBoundaryChecking {
    innerPatternString(context) {
        return (`(?:(?:,|\\(|（)\\s*)?` +
            `(?:в\\s*?)?` +
            `(?:(эту|этот|прошлый|прошлую|следующий|следующую|следующего)\\s*)?` +
            `(${(0, pattern_1.matchAnyPattern)(constants_1.WEEKDAY_DICTIONARY)})` +
            `(?:\\s*(?:,|\\)|）))?` +
            `(?:\\s*на\\s*(этой|прошлой|следующей)\\s*неделе)?`);
    }
    innerExtract(context, match) {
        const dayOfWeek = match[WEEKDAY_GROUP].toLowerCase();
        const weekday = constants_1.WEEKDAY_DICTIONARY[dayOfWeek];
        const prefix = match[PREFIX_GROUP];
        const postfix = match[POSTFIX_GROUP];
        let modifierWord = prefix || postfix;
        modifierWord = modifierWord || "";
        modifierWord = modifierWord.toLowerCase();
        let modifier = null;
        if (modifierWord == "прошлый" || modifierWord == "прошлую" || modifierWord == "прошлой") {
            modifier = "last";
        }
        else if (modifierWord == "следующий" ||
            modifierWord == "следующую" ||
            modifierWord == "следующей" ||
            modifierWord == "следующего") {
            modifier = "next";
        }
        else if (modifierWord == "этот" || modifierWord == "эту" || modifierWord == "этой") {
            modifier = "this";
        }
        return (0, weekdays_1.createParsingComponentsAtWeekday)(context.reference, weekday, modifier);
    }
}
exports.default = RUWeekdayParser;
//# sourceMappingURL=RUWeekdayParser.js.map