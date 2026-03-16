import AbstractMergeDateRangeRefiner from "../../../common/refiners/AbstractMergeDateRangeRefiner.js";
export default class NLMergeDateRangeRefiner extends AbstractMergeDateRangeRefiner {
    patternBetween() {
        return /^\s*(tot|-)\s*$/i;
    }
}
//# sourceMappingURL=NLMergeDateRangeRefiner.js.map