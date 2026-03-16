import AbstractMergeDateRangeRefiner from "../../../common/refiners/AbstractMergeDateRangeRefiner.js";
export default class ESMergeDateRangeRefiner extends AbstractMergeDateRangeRefiner {
    patternBetween() {
        return /^\s*(?:-)\s*$/i;
    }
}
//# sourceMappingURL=ESMergeDateRangeRefiner.js.map