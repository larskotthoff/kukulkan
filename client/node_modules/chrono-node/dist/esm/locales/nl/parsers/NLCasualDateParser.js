import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
import * as references from "../../../common/casualReferences.js";
export default class NLCasualDateParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(context) {
        return /(nu|vandaag|morgen|morgend|gisteren)(?=\W|$)/i;
    }
    innerExtract(context, match) {
        const lowerText = match[0].toLowerCase();
        const component = context.createParsingComponents();
        switch (lowerText) {
            case "nu":
                return references.now(context.reference);
            case "vandaag":
                return references.today(context.reference);
            case "morgen":
            case "morgend":
                return references.tomorrow(context.reference);
            case "gisteren":
                return references.yesterday(context.reference);
        }
        return component;
    }
}
//# sourceMappingURL=NLCasualDateParser.js.map