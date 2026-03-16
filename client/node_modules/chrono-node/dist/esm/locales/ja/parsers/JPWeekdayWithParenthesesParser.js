import { WEEKDAY_OFFSET } from "../constants.js";
import { createParsingComponentsAtWeekday } from "../../../calculation/weekdays.js";
const PATTERN = new RegExp("(?:\\(|\\（)(?<weekday>" + Object.keys(WEEKDAY_OFFSET).join("|") + ")(?:\\)|\\）)", "i");
export default class JPWeekdayWithParenthesesParser {
    pattern() {
        return PATTERN;
    }
    extract(context, match) {
        const dayOfWeek = match.groups.weekday;
        const offset = WEEKDAY_OFFSET[dayOfWeek];
        if (offset === undefined)
            return null;
        return createParsingComponentsAtWeekday(context.reference, offset);
    }
}
//# sourceMappingURL=JPWeekdayWithParenthesesParser.js.map