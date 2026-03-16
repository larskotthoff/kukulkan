import { TIME_UNITS_PATTERN, parseTimeUnits } from "../constants.js";
import { ParsingComponents } from "../../../results.js";
import { reverseTimeUnits } from "../../../utils/timeunits.js";
import { AbstractParserWithLeftRightBoundaryChecking } from "./AbstractParserWithWordBoundaryChecking.js";
export default class UKTimeUnitCasualRelativeFormatParser extends AbstractParserWithLeftRightBoundaryChecking {
    innerPatternString(context) {
        return `(ці|останні|минулі|майбутні|наступні|після|через|\\+|-)\\s*(${TIME_UNITS_PATTERN})`;
    }
    innerExtract(context, match) {
        const prefix = match[1].toLowerCase();
        let timeUnits = parseTimeUnits(match[3]);
        switch (prefix) {
            case "останні":
            case "минулі":
            case "-":
                timeUnits = reverseTimeUnits(timeUnits);
                break;
        }
        return ParsingComponents.createRelativeFromReference(context.reference, timeUnits);
    }
}
//# sourceMappingURL=UKTimeUnitCasualRelativeFormatParser.js.map