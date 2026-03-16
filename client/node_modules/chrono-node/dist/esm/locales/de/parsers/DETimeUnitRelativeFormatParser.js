import { NUMBER_PATTERN, parseNumberPattern, TIME_UNIT_DICTIONARY } from "../constants.js";
import { ParsingComponents } from "../../../results.js";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
import { reverseTimeUnits } from "../../../utils/timeunits.js";
import { matchAnyPattern } from "../../../utils/pattern.js";
export default class DETimeUnitAgoFormatParser extends AbstractParserWithWordBoundaryChecking {
    constructor() {
        super();
    }
    innerPattern() {
        return new RegExp(`(?:\\s*((?:nächste|kommende|folgende|letzte|vergangene|vorige|vor(?:her|an)gegangene)(?:s|n|m|r)?|vor|in)\\s*)?` +
            `(${NUMBER_PATTERN})?` +
            `(?:\\s*(nächste|kommende|folgende|letzte|vergangene|vorige|vor(?:her|an)gegangene)(?:s|n|m|r)?)?` +
            `\\s*(${matchAnyPattern(TIME_UNIT_DICTIONARY)})`, "i");
    }
    innerExtract(context, match) {
        const num = match[2] ? parseNumberPattern(match[2]) : 1;
        const unit = TIME_UNIT_DICTIONARY[match[4].toLowerCase()];
        let timeUnits = {};
        timeUnits[unit] = num;
        let modifier = match[1] || match[3] || "";
        modifier = modifier.toLowerCase();
        if (!modifier) {
            return;
        }
        if (/vor/.test(modifier) || /letzte/.test(modifier) || /vergangen/.test(modifier)) {
            timeUnits = reverseTimeUnits(timeUnits);
        }
        return ParsingComponents.createRelativeFromReference(context.reference, timeUnits);
    }
}
//# sourceMappingURL=DETimeUnitRelativeFormatParser.js.map