"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const weekdays_1 = require("../../../calculation/weekdays");
const PATTERN = new RegExp("((?<prefix>前の|次の|今週))?(?<weekday>" + Object.keys(constants_1.WEEKDAY_OFFSET).join("|") + ")(?:曜日|曜)", "i");
class JPWeekdayParser {
    pattern() {
        return PATTERN;
    }
    extract(context, match) {
        const dayOfWeek = match.groups.weekday;
        const offset = constants_1.WEEKDAY_OFFSET[dayOfWeek];
        if (offset === undefined)
            return null;
        const prefix = match.groups.prefix || "";
        let modifier = null;
        if (prefix.match(/前の/)) {
            modifier = "last";
        }
        else if (prefix.match(/次の/)) {
            modifier = "next";
        }
        else if (prefix.match(/今週/)) {
            modifier = "this";
        }
        return (0, weekdays_1.createParsingComponentsAtWeekday)(context.reference, offset, modifier);
    }
}
exports.default = JPWeekdayParser;
//# sourceMappingURL=JPWeekdayParser.js.map