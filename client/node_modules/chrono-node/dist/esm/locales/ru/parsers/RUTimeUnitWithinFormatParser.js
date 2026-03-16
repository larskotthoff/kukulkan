import { TIME_UNITS_PATTERN, parseTimeUnits, REGEX_PARTS } from "../constants.js";
import { ParsingComponents } from "../../../results.js";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
const PATTERN = `(?:(?:около|примерно)\\s*(?:~\\s*)?)?(${TIME_UNITS_PATTERN})${REGEX_PARTS.rightBoundary}`;
export default class RUTimeUnitWithinFormatParser extends AbstractParserWithWordBoundaryChecking {
    patternLeftBoundary() {
        return REGEX_PARTS.leftBoundary;
    }
    innerPattern(context) {
        return context.option.forwardDate
            ? new RegExp(PATTERN, REGEX_PARTS.flags)
            : new RegExp(`(?:в течение|в течении)\\s*${PATTERN}`, REGEX_PARTS.flags);
    }
    innerExtract(context, match) {
        const timeUnits = parseTimeUnits(match[1]);
        return ParsingComponents.createRelativeFromReference(context.reference, timeUnits);
    }
}
//# sourceMappingURL=RUTimeUnitWithinFormatParser.js.map