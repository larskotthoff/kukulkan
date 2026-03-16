import AbstractMergeDateRangeRefiner from "../../../common/refiners/AbstractMergeDateRangeRefiner.js";
export default class UKMergeDateRangeRefiner extends AbstractMergeDateRangeRefiner {
    patternBetween() {
        return /^\s*(і до|і по|до|по|-)\s*$/i;
    }
}
//# sourceMappingURL=UKMergeDateRangeRefiner.js.map