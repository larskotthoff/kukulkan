import AbstractMergeDateTimeRefiner from "../../../common/refiners/AbstractMergeDateTimeRefiner.js";
export default class UKMergeDateTimeRefiner extends AbstractMergeDateTimeRefiner {
    patternBetween() {
        return new RegExp(`^\\s*(T|в|у|о|,|-)?\\s*$`);
    }
}
//# sourceMappingURL=UKMergeDateTimeRefiner.js.map