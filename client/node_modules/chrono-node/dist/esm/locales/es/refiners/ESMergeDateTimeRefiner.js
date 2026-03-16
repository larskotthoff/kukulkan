import AbstractMergeDateTimeRefiner from "../../../common/refiners/AbstractMergeDateTimeRefiner.js";
export default class ESMergeDateTimeRefiner extends AbstractMergeDateTimeRefiner {
    patternBetween() {
        return new RegExp("^\\s*(?:,|de|aslas|a)?\\s*$");
    }
}
//# sourceMappingURL=ESMergeDateTimeRefiner.js.map