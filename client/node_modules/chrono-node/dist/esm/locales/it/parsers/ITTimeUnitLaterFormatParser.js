import { parseTimeUnits, TIME_UNITS_PATTERN } from "../constants.js";
import { ParsingComponents } from "../../../results.js";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
const PATTERN = new RegExp(`(${TIME_UNITS_PATTERN})\\s{0,5}(?:dopo|più tardi|da adesso|avanti|oltre|a seguire)` + "(?=(?:\\W|$))", "i");
const STRICT_PATTERN = new RegExp("" + "(" + TIME_UNITS_PATTERN + ")" + "(dopo|più tardi)" + "(?=(?:\\W|$))", "i");
const GROUP_NUM_TIMEUNITS = 1;
export default class ENTimeUnitLaterFormatParser extends AbstractParserWithWordBoundaryChecking {
    strictMode;
    constructor(strictMode) {
        super();
        this.strictMode = strictMode;
    }
    innerPattern() {
        return this.strictMode ? STRICT_PATTERN : PATTERN;
    }
    innerExtract(context, match) {
        const fragments = parseTimeUnits(match[GROUP_NUM_TIMEUNITS]);
        return ParsingComponents.createRelativeFromReference(context.reference, fragments);
    }
}
//# sourceMappingURL=ITTimeUnitLaterFormatParser.js.map