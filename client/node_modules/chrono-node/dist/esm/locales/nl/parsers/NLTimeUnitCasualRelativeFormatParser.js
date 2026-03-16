import { TIME_UNITS_PATTERN, parseTimeUnits } from "../constants.js";
import { ParsingComponents } from "../../../results.js";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
import { reverseTimeUnits } from "../../../utils/timeunits.js";
const PATTERN = new RegExp(`(dit|deze|vorig|afgelopen|(?:aan)?komend|over|\\+|-)e?\\s*(${TIME_UNITS_PATTERN})(?=\\W|$)`, "i");
const PREFIX_WORD_GROUP = 1;
const TIME_UNIT_WORD_GROUP = 2;
export default class NLTimeUnitCasualRelativeFormatParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern() {
        return PATTERN;
    }
    innerExtract(context, match) {
        const prefix = match[PREFIX_WORD_GROUP].toLowerCase();
        let timeUnits = parseTimeUnits(match[TIME_UNIT_WORD_GROUP]);
        switch (prefix) {
            case "vorig":
            case "afgelopen":
            case "-":
                timeUnits = reverseTimeUnits(timeUnits);
                break;
        }
        return ParsingComponents.createRelativeFromReference(context.reference, timeUnits);
    }
}
//# sourceMappingURL=NLTimeUnitCasualRelativeFormatParser.js.map