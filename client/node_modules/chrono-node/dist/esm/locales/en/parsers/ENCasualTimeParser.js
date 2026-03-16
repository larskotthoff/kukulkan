import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
import * as casualReferences from "../../../common/casualReferences.js";
const PATTERN = /(?:this)?\s{0,3}(morning|afternoon|evening|night|midnight|midday|noon)(?=\W|$)/i;
export default class ENCasualTimeParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern() {
        return PATTERN;
    }
    innerExtract(context, match) {
        let component = null;
        switch (match[1].toLowerCase()) {
            case "afternoon":
                component = casualReferences.afternoon(context.reference);
                break;
            case "evening":
            case "night":
                component = casualReferences.evening(context.reference);
                break;
            case "midnight":
                component = casualReferences.midnight(context.reference);
                break;
            case "morning":
                component = casualReferences.morning(context.reference);
                break;
            case "noon":
            case "midday":
                component = casualReferences.noon(context.reference);
                break;
        }
        if (component) {
            component.addTag("parser/ENCasualTimeParser");
        }
        return component;
    }
}
//# sourceMappingURL=ENCasualTimeParser.js.map