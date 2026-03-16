"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstractRefiners_1 = require("../../../common/abstractRefiners");
class JPMergeWeekdayComponentRefiner extends abstractRefiners_1.MergingRefiner {
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
exports.default = JPMergeWeekdayComponentRefiner;
//# sourceMappingURL=JPMergeWeekdayComponentRefiner.js.map