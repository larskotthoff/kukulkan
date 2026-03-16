import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
import { Meridiem } from "../../../types.js";
import { assignSimilarDate, assignTheNextDay } from "../../../utils/dayjs.js";
import dayjs from "dayjs";
const DATE_GROUP = 1;
const TIME_OF_DAY_GROUP = 2;
export default class NLCasualDateTimeParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(context) {
        return /(gisteren|morgen|van)(ochtend|middag|namiddag|avond|nacht)(?=\W|$)/i;
    }
    innerExtract(context, match) {
        const dateText = match[DATE_GROUP].toLowerCase();
        const timeText = match[TIME_OF_DAY_GROUP].toLowerCase();
        const component = context.createParsingComponents();
        const targetDate = dayjs(context.refDate);
        switch (dateText) {
            case "gisteren":
                assignSimilarDate(component, targetDate.add(-1, "day"));
                break;
            case "van":
                assignSimilarDate(component, targetDate);
                break;
            case "morgen":
                assignTheNextDay(component, targetDate);
                break;
        }
        switch (timeText) {
            case "ochtend":
                component.imply("meridiem", Meridiem.AM);
                component.imply("hour", 6);
                break;
            case "middag":
                component.imply("meridiem", Meridiem.AM);
                component.imply("hour", 12);
                break;
            case "namiddag":
                component.imply("meridiem", Meridiem.PM);
                component.imply("hour", 15);
                break;
            case "avond":
                component.imply("meridiem", Meridiem.PM);
                component.imply("hour", 20);
                break;
        }
        return component;
    }
}
//# sourceMappingURL=NLCasualDateTimeParser.js.map