import AbstractMergeDateTimeRefiner from "../../../common/refiners/AbstractMergeDateTimeRefiner.js";
export default class ENMergeDateTimeRefiner extends AbstractMergeDateTimeRefiner {
    patternBetween() {
        return new RegExp("^\\s*(T|alle|dopo|prima|il|di|del|delle|,|-)?\\s*$");
    }
}
//# sourceMappingURL=ITMergeDateTimeRefiner.js.map