import AbstractMergeDateTimeRefiner from "../../../common/refiners/AbstractMergeDateTimeRefiner.js";
export default class JPMergeDateTimeRefiner extends AbstractMergeDateTimeRefiner {
    patternBetween() {
        return /^\s*(の)?\s*$/i;
    }
}
//# sourceMappingURL=JPMergeDateTimeRefiner.js.map