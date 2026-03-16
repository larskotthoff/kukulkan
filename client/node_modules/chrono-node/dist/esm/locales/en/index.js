import { Chrono } from "../../chrono.js";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "../../results.js";
import { Meridiem, Weekday } from "../../types.js";
import ENDefaultConfiguration from "./configuration.js";
export { Chrono, ParsingResult, ParsingComponents, ReferenceWithTimezone };
export { Meridiem, Weekday };
export const configuration = new ENDefaultConfiguration();
export const casual = new Chrono(configuration.createCasualConfiguration(false));
export const strict = new Chrono(configuration.createConfiguration(true, false));
export const GB = new Chrono(configuration.createCasualConfiguration(true));
export function parse(text, ref, option) {
    return casual.parse(text, ref, option);
}
export function parseDate(text, ref, option) {
    return casual.parseDate(text, ref, option);
}
//# sourceMappingURL=index.js.map