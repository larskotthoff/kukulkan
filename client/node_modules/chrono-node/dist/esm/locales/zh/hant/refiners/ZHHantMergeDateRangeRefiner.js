import AbstractMergeDateRangeRefiner from "../../../../common/refiners/AbstractMergeDateRangeRefiner.js";
export default class ZHHantMergeDateRangeRefiner extends AbstractMergeDateRangeRefiner {
    patternBetween() {
        return /^\s*(至|到|\-|\~|～|－|ー)\s*$/i;
    }
}
//# sourceMappingURL=ZHHantMergeDateRangeRefiner.js.map