import AbstractMergeDateRangeRefiner from "../../../../common/refiners/AbstractMergeDateRangeRefiner.js";
export default class ZHHansMergeDateRangeRefiner extends AbstractMergeDateRangeRefiner {
    patternBetween() {
        return /^\s*(至|到|-|~|～|－|ー)\s*$/i;
    }
}
//# sourceMappingURL=ZHHansMergeDateRangeRefiner.js.map