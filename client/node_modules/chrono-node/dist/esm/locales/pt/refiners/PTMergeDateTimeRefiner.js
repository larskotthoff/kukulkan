import AbstractMergeDateTimeRefiner from "../../../common/refiners/AbstractMergeDateTimeRefiner.js";
export default class PTMergeDateTimeRefiner extends AbstractMergeDateTimeRefiner {
    patternBetween() {
        return new RegExp("^\\s*(?:,|à)?\\s*$");
    }
}
//# sourceMappingURL=PTMergeDateTimeRefiner.js.map