import AbstractMergeDateRangeRefiner from "../../../common/refiners/AbstractMergeDateRangeRefiner.js";
export default class JPMergeDateRangeRefiner extends AbstractMergeDateRangeRefiner {
    patternBetween() {
        return /^\s*(から|－|ー|-|～|~)\s*$/i;
    }
}
//# sourceMappingURL=JPMergeDateRangeRefiner.js.map