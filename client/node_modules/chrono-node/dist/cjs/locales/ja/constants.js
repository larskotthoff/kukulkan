"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEEKDAY_OFFSET = exports.NUMBER = void 0;
exports.toHankaku = toHankaku;
exports.jaStringToNumber = jaStringToNumber;
exports.NUMBER = {
    "零": 0,
    "〇": 0,
    "一": 1,
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
    "十": 10,
};
exports.WEEKDAY_OFFSET = {
    "日": 0,
    "月": 1,
    "火": 2,
    "水": 3,
    "木": 4,
    "金": 5,
    "土": 6,
};
function toHankaku(text) {
    return String(text)
        .replace(/\u2019/g, "\u0027")
        .replace(/\u201D/g, "\u0022")
        .replace(/\u3000/g, "\u0020")
        .replace(/\uFFE5/g, "\u00A5")
        .replace(/[\uFF01\uFF03-\uFF06\uFF08\uFF09\uFF0C-\uFF19\uFF1C-\uFF1F\uFF21-\uFF3B\uFF3D\uFF3F\uFF41-\uFF5B\uFF5D\uFF5E]/g, alphaNum);
}
function alphaNum(token) {
    return String.fromCharCode(token.charCodeAt(0) - 65248);
}
function jaStringToNumber(text) {
    let number = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === "十") {
            number = number === 0 ? exports.NUMBER[char] : number * exports.NUMBER[char];
        }
        else {
            number += exports.NUMBER[char];
        }
    }
    return number;
}
//# sourceMappingURL=constants.js.map