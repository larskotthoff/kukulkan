import AbstractMergeDateTimeRefiner from "../../../common/refiners/AbstractMergeDateTimeRefiner.js";
export default class FRMergeDateTimeRefiner extends AbstractMergeDateTimeRefiner {
    patternBetween() {
        return new RegExp("^\\s*(T|à|a|au|vers|de|,|-)?\\s*$");
    }
}
//# sourceMappingURL=FRMergeDateTimeRefiner.js.map