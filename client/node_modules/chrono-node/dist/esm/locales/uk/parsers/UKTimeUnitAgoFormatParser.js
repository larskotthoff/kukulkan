import { parseTimeUnits, TIME_UNITS_PATTERN } from "../constants.js";
import { ParsingComponents } from "../../../results.js";
import { reverseTimeUnits } from "../../../utils/timeunits.js";
import { AbstractParserWithLeftBoundaryChecking } from "./AbstractParserWithWordBoundaryChecking.js";
export default class UKTimeUnitAgoFormatParser extends AbstractParserWithLeftBoundaryChecking {
    innerPatternString(context) {
        return `(${TIME_UNITS_PATTERN})\\s{0,5}тому(?=(?:\\W|$))`;
    }
    innerExtract(context, match) {
        const timeUnits = parseTimeUnits(match[1]);
        const outputTimeUnits = reverseTimeUnits(timeUnits);
        return ParsingComponents.createRelativeFromReference(context.reference, outputTimeUnits);
    }
}
//# sourceMappingURL=UKTimeUnitAgoFormatParser.js.map