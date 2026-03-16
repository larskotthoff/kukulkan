import { MergingRefiner } from "../../../common/abstractRefiners.js";
export default class JPMergeWeekdayComponentRefiner extends MergingRefiner {
    mergeResults(textBetween, currentResult, nextResult) {
        const newResult = currentResult.clone();
        newResult.text = currentResult.text + textBetween + nextResult.text;
        newResult.start.assign("weekday", nextResult.start.get("weekday"));
        if (newResult.end) {
            newResult.end.assign("weekday", nextResult.start.get("weekday"));
        }
        return newResult;
    }
    shouldMergeResults(textBetween, currentResult, nextResult) {
        const normalDateThenWeekday = currentResult.start.isCertain("day") &&
            nextResult.start.isOnlyWeekdayComponent() &&
            !nextResult.start.isCertain("hour");
        return normalDateThenWeekday && textBetween.match(/^[,、の]?\s*$/) !== null;
    }
}
//# sourceMappingURL=JPMergeWeekdayComponentRefiner.js.map