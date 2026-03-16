"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const years_1 = require("../../../calculation/years");
const constants_1 = require("../constants");
const PATTERN = new RegExp("([0-9０-９]{4}[\\/|\\／])?" + "([0-1０-１]{0,1}[0-9０-９]{1})(?:[\\/|\\／]([0-3０-３]{0,1}[0-9０-９]{1}))", "i");
const YEAR_GROUP = 1;
const MONTH_GROUP = 2;
const DAY_GROUP = 3;
class JPSlashDateFormatParser {
    pattern() {
        return PATTERN;
    }
    extract(context, match) {
        const result = context.createParsingComponents();
        const month = parseInt((0, constants_1.toHankaku)(match[MONTH_GROUP]));
        const day = parseInt((0, constants_1.toHankaku)(match[DAY_GROUP]));
        if (month < 1 || month > 12) {
            return null;
        }
        if (day < 1 || day > 31) {
            return null;
        }
        result.assign("day", day);
        result.assign("month", month);
        if (match[YEAR_GROUP]) {
            const rawYearNumber = parseInt((0, constants_1.toHankaku)(match[YEAR_GROUP]));
            const year = (0, years_1.findMostLikelyADYear)(rawYearNumber);
            result.assign("year", year);
        }
        else {
            const year = (0, years_1.findYearClosestToRef)(context.reference.instant, day, month);
            result.imply("year", year);
        }
        return result;
    }
}
exports.default = JPSlashDateFormatParser;
//# sourceMappingURL=JPSlashDateFormatParser.js.map