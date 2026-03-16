import { WEEKDAY_OFFSET } from "../constants.js";
import { createParsingComponentsAtWeekday } from "../../../calculation/weekdays.js";
const PATTERN = new RegExp("((?<prefix>前の|次の|今週))?(?<weekday>" + Object.keys(WEEKDAY_OFFSET).join("|") + ")(?:曜日|曜)", "i");
export default class JPWeekdayParser {
    pattern() {
        return PATTERN;
    }
    extract(context, match) {
        const dayOfWeek = match.groups.weekday;
        const offset = WEEKDAY_OFFSET[dayOfWeek];
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
        return createParsingComponentsAtWeekday(context.reference, offset, modifier);
    }
}
//# sourceMappingURL=JPWeekdayParser.js.map