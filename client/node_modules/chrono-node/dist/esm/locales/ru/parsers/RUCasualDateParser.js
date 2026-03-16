import * as references from "../../../common/casualReferences.js";
import { AbstractParserWithLeftRightBoundaryChecking } from "./AbstractParserWithWordBoundaryChecking.js";
export default class RUCasualDateParser extends AbstractParserWithLeftRightBoundaryChecking {
    innerPatternString(context) {
        return `(?:с|со)?\\s*(сегодня|вчера|завтра|послезавтра|послепослезавтра|позапозавчера|позавчера)`;
    }
    innerExtract(context, match) {
        const lowerText = match[1].toLowerCase();
        const component = context.createParsingComponents();
        switch (lowerText) {
            case "сегодня":
                return references.today(context.reference);
            case "вчера":
                return references.yesterday(context.reference);
            case "завтра":
                return references.tomorrow(context.reference);
            case "послезавтра":
                return references.theDayAfter(context.reference, 2);
            case "послепослезавтра":
                return references.theDayAfter(context.reference, 3);
            case "позавчера":
                return references.theDayBefore(context.reference, 2);
            case "позапозавчера":
                return references.theDayBefore(context.reference, 3);
        }
        return component;
    }
}
//# sourceMappingURL=RUCasualDateParser.js.map