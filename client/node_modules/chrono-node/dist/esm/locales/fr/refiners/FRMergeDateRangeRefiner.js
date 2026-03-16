import AbstractMergeDateRangeRefiner from "../../../common/refiners/AbstractMergeDateRangeRefiner.js";
export default class FRMergeDateRangeRefiner extends AbstractMergeDateRangeRefiner {
    patternBetween() {
        return /^\s*(à|a|au|-)\s*$/i;
    }
}
//# sourceMappingURL=FRMergeDateRangeRefiner.js.map