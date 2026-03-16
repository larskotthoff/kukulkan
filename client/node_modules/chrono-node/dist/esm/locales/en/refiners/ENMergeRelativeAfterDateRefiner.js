import { MergingRefiner } from "../../../common/abstractRefiners.js";
import { ParsingComponents, ParsingResult, ReferenceWithTimezone } from "../../../results.js";
import { parseTimeUnits } from "../constants.js";
import { reverseTimeUnits } from "../../../utils/timeunits.js";
function IsPositiveFollowingReference(result) {
    return result.text.match(/^[+-]/i) != null;
}
function IsNegativeFollowingReference(result) {
    return result.text.match(/^-/i) != null;
}
export default class ENMergeRelativeAfterDateRefiner extends MergingRefiner {
    shouldMergeResults(textBetween, currentResult, nextResult) {
        if (!textBetween.match(/^\s*$/i)) {
            return false;
        }
        return IsPositiveFollowingReference(nextResult) || IsNegativeFollowingReference(nextResult);
    }
    mergeResults(textBetween, currentResult, nextResult, context) {
        let timeUnits = parseTimeUnits(nextResult.text);
        if (IsNegativeFollowingReference(nextResult)) {
            timeUnits = reverseTimeUnits(timeUnits);
        }
        const components = ParsingComponents.createRelativeFromReference(new ReferenceWithTimezone(currentResult.start.date()), timeUnits);
        return new ParsingResult(currentResult.reference, currentResult.index, `${currentResult.text}${textBetween}${nextResult.text}`, components);
    }
}
//# sourceMappingURL=ENMergeRelativeAfterDateRefiner.js.map