"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const YEAR_SUFFIX_PATTERN = new RegExp(`^\\s*(${constants_1.YEAR_PATTERN})`, "i");
const YEAR_GROUP = 1;
class ENExtractYearSuffixRefiner {
    refine(context, results) {
        results.forEach(function (result) {
            if (!result.start.isDateWithUnknownYear()) {
                return;
            }
            const suffix = context.text.substring(result.index + result.text.length);
            const match = YEAR_SUFFIX_PATTERN.exec(suffix);
            if (!match) {
                return;
            }
            if (match[0].trim().length <= 3) {
                return;
            }
            context.debug(() => {
                console.log(`Extracting year: '${match[0]}' into : ${result}`);
            });
            const year = (0, constants_1.parseYear)(match[YEAR_GROUP]);
            if (result.end != null) {
                result.end.assign("year", year);
            }
            result.start.assign("year", year);
            result.text += match[0];
        });
        return results;
    }
}
exports.default = ENExtractYearSuffixRefiner;
//# sourceMappingURL=ENExtractYearSuffixRefiner.js.map