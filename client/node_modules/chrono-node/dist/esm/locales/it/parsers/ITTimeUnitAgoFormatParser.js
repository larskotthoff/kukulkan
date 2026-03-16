import { parseTimeUnits, TIME_UNITS_PATTERN } from "../constants.js";
import { ParsingComponents } from "../../../results.js";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
import { reverseTimeUnits } from "../../../utils/timeunits.js";
const PATTERN = new RegExp(`(${TIME_UNITS_PATTERN})\\s{0,5}(?:fa|prima|precedente)(?=(?:\\W|$))`, "i");
const STRICT_PATTERN = new RegExp(`(${TIME_UNITS_PATTERN})\\s{0,5}fa(?=(?:\\W|$))`, "i");
export default class ENTimeUnitAgoFormatParser extends AbstractParserWithWordBoundaryChecking {
    strictMode;
    constructor(strictMode) {
        super();
        this.strictMode = strictMode;
    }
    innerPattern() {
        return this.strictMode ? STRICT_PATTERN : PATTERN;
    }
    innerExtract(context, match) {
        const timeUnits = parseTimeUnits(match[1]);
        const outputTimeUnits = reverseTimeUnits(timeUnits);
        return ParsingComponents.createRelativeFromReference(context.reference, outputTimeUnits);
    }
}
//# sourceMappingURL=ITTimeUnitAgoFormatParser.js.map