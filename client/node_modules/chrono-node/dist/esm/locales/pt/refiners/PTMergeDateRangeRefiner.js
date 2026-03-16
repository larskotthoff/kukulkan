import AbstractMergeDateRangeRefiner from "../../../common/refiners/AbstractMergeDateRangeRefiner.js";
export default class PTMergeDateRangeRefiner extends AbstractMergeDateRangeRefiner {
    patternBetween() {
        return /^\s*(?:-)\s*$/i;
    }
}
//# sourceMappingURL=PTMergeDateRangeRefiner.js.map