import AbstractMergeDateRangeRefiner from "../../../common/refiners/AbstractMergeDateRangeRefiner.js";
export default class RUMergeDateRangeRefiner extends AbstractMergeDateRangeRefiner {
    patternBetween() {
        return /^\s*(и до|и по|до|по|-)\s*$/i;
    }
}
//# sourceMappingURL=RUMergeDateRangeRefiner.js.map