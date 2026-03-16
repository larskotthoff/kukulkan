import AbstractMergeDateTimeRefiner from "../../../common/refiners/AbstractMergeDateTimeRefiner.js";
export default class RUMergeDateTimeRefiner extends AbstractMergeDateTimeRefiner {
    patternBetween() {
        return new RegExp(`^\\s*(T|в|,|-)?\\s*$`);
    }
}
//# sourceMappingURL=RUMergeDateTimeRefiner.js.map