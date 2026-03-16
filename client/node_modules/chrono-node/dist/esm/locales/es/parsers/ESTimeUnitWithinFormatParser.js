import { TIME_UNITS_PATTERN, parseTimeUnits } from "../constants.js";
import { ParsingComponents } from "../../../results.js";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
export default class ESTimeUnitWithinFormatParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern() {
        return new RegExp(`(?:en|por|durante|de|dentro de)\\s*(${TIME_UNITS_PATTERN})(?=\\W|$)`, "i");
    }
    innerExtract(context, match) {
        const timeUnits = parseTimeUnits(match[1]);
        return ParsingComponents.createRelativeFromReference(context.reference, timeUnits);
    }
}
//# sourceMappingURL=ESTimeUnitWithinFormatParser.js.map