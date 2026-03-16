import AbstractMergeDateRangeRefiner from "../../../common/refiners/AbstractMergeDateRangeRefiner.js";
export default class ENMergeDateRangeRefiner extends AbstractMergeDateRangeRefiner {
    patternBetween() {
        return /^\s*(to|-)\s*$/i;
    }
}
//# sourceMappingURL=ITMergeDateRangeRefiner.js.map