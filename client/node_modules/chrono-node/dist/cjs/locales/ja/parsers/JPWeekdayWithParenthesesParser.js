"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const weekdays_1 = require("../../../calculation/weekdays");
const PATTERN = new RegExp("(?:\\(|\\（)(?<weekday>" + Object.keys(constants_1.WEEKDAY_OFFSET).join("|") + ")(?:\\)|\\）)", "i");
class JPWeekdayWithParenthesesParser {
    pattern() {
        return PATTERN;
    }
    extract(context, match) {
        const dayOfWeek = match.groups.weekday;
        const offset = constants_1.WEEKDAY_OFFSET[dayOfWeek];
        if (offset === undefined)
            return null;
        return (0, weekdays_1.createParsingComponentsAtWeekday)(context.reference, offset);
    }
}
exports.default = JPWeekdayWithParenthesesParser;
//# sourceMappingURL=JPWeekdayWithParenthesesParser.js.map