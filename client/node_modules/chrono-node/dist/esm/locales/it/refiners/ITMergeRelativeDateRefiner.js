import { MergingRefiner } from "../../../common/abstractRefiners.js";
import { ParsingComponents, ParsingResult, ReferenceWithTimezone } from "../../../results.js";
import { parseTimeUnits } from "../constants.js";
import { reverseTimeUnits } from "../../../utils/timeunits.js";
function hasImpliedEarlierReferenceDate(result) {
    return result.text.match(/\s+(prima|dal)$/i) != null;
}
function hasImpliedLaterReferenceDate(result) {
    return result.text.match(/\s+(dopo|dal|fino)$/i) != null;
}
export default class ENMergeRelativeDateRefiner extends MergingRefiner {
    patternBetween() {
        return /^\s*$/i;
    }
    shouldMergeResults(textBetween, currentResult, nextResult) {
        if (!textBetween.match(this.patternBetween())) {
            return false;
        }
        if (!hasImpliedEarlierReferenceDate(currentResult) && !hasImpliedLaterReferenceDate(currentResult)) {
            return false;
        }
        return !!nextResult.start.get("day") && !!nextResult.start.get("month") && !!nextResult.start.get("year");
    }
    mergeResults(textBetween, currentResult, nextResult) {
        let timeUnits = parseTimeUnits(currentResult.text);
        if (hasImpliedEarlierReferenceDate(currentResult)) {
            timeUnits = reverseTimeUnits(timeUnits);
        }
        const components = ParsingComponents.createRelativeFromReference(new ReferenceWithTimezone(nextResult.start.date()), timeUnits);
        return new ParsingResult(nextResult.reference, currentResult.index, `${currentResult.text}${textBetween}${nextResult.text}`, components);
    }
}
//# sourceMappingURL=ITMergeRelativeDateRefiner.js.map