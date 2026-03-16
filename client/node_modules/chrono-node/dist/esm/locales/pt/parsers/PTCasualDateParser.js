import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
import * as references from "../../../common/casualReferences.js";
export default class PTCasualDateParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(context) {
        return /(agora|hoje|amanha|amanhã|ontem)(?=\W|$)/i;
    }
    innerExtract(context, match) {
        const lowerText = match[0].toLowerCase();
        const component = context.createParsingComponents();
        switch (lowerText) {
            case "agora":
                return references.now(context.reference);
            case "hoje":
                return references.today(context.reference);
            case "amanha":
            case "amanhã":
                return references.tomorrow(context.reference);
            case "ontem":
                return references.yesterday(context.reference);
        }
        return component;
    }
}
//# sourceMappingURL=PTCasualDateParser.js.map