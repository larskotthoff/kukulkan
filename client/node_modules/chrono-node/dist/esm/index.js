import * as en from "./locales/en/index.js";
import { Chrono, ParsingContext } from "./chrono.js";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "./results.js";
import { Meridiem, Weekday } from "./types.js";
export { en, Chrono, ParsingContext, ParsingResult, ParsingComponents, ReferenceWithTimezone };
export { Meridiem, Weekday };
import * as de from "./locales/de/index.js";
import * as fr from "./locales/fr/index.js";
import * as ja from "./locales/ja/index.js";
import * as pt from "./locales/pt/index.js";
import * as nl from "./locales/nl/index.js";
import * as zh from "./locales/zh/index.js";
import * as ru from "./locales/ru/index.js";
import * as es from "./locales/es/index.js";
import * as uk from "./locales/uk/index.js";
export { de, fr, ja, pt, nl, zh, ru, es, uk };
export const strict = en.strict;
export const casual = en.casual;
export function parse(text, ref, option) {
    return casual.parse(text, ref, option);
}
export function parseDate(text, ref, option) {
    return casual.parseDate(text, ref, option);
}
//# sourceMappingURL=index.js.map