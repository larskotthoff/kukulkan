"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractParserWithWordBoundary_1 = require("../../../common/parsers/AbstractParserWithWordBoundary");
const types_1 = require("../../../types");
const constants_1 = require("../constants");
const FIRST_REG_PATTERN = new RegExp("(?:" +
    "(午前|午後|A.M.|P.M.|AM|PM)" +
    ")?" +
    "(?:[\\s,，、]*)" +
    "(?:([0-9０-９]+|[" +
    Object.keys(constants_1.NUMBER).join("") +
    "]+)(?:\\s*)(?:時|:|：)" +
    "(?:\\s*)" +
    "([0-9０-９]+|半|[" +
    Object.keys(constants_1.NUMBER).join("") +
    "]+)?(?:\\s*)(?:分|:|：)?" +
    "(?:\\s*)" +
    "([0-9０-９]+|[" +
    Object.keys(constants_1.NUMBER).join("") +
    "]+)?(?:\\s*)(?:秒)?)" +
    "(?:\\s*(A.M.|P.M.|AM?|PM?))?", "i");
const SECOND_REG_PATTERN = new RegExp("(?:^\\s*(?:から|\\-|\\–|\\－|\\~|\\〜)\\s*)" +
    "(?:" +
    "(午前|午後|A.M.|P.M.|AM|PM)" +
    ")?" +
    "(?:[\\s,，、]*)" +
    "(?:([0-9０-９]+|[" +
    Object.keys(constants_1.NUMBER).join("") +
    "]+)(?:\\s*)(?:時|:|：)" +
    "(?:\\s*)" +
    "([0-9０-９]+|半|[" +
    Object.keys(constants_1.NUMBER).join("") +
    "]+)?(?:\\s*)(?:分|:|：)?" +
    "(?:\\s*)" +
    "([0-9０-９]+|[" +
    Object.keys(constants_1.NUMBER).join("") +
    "]+)?(?:\\s*)(?:秒)?)" +
    "(?:\\s*(A.M.|P.M.|AM?|PM?))?", "i");
const AM_PM_HOUR_GROUP_1 = 1;
const HOUR_GROUP = 2;
const MINUTE_GROUP = 3;
const SECOND_GROUP = 4;
const AM_PM_HOUR_GROUP_2 = 5;
class JPTimeExpressionParser extends AbstractParserWithWordBoundary_1.AbstractParserWithWordBoundaryChecking {
    innerPattern() {
        return FIRST_REG_PATTERN;
    }
    innerExtract(context, match) {
        if (match.index > 0 && context.text[match.index - 1].match(/\w/)) {
            return null;
        }
        const result = context.createParsingResult(match.index, match[0]);
        let hour = 0;
        let minute = 0;
        let meridiem = -1;
        if (match[SECOND_GROUP]) {
            let second = parseInt((0, constants_1.toHankaku)(match[SECOND_GROUP]));
            if (isNaN(second)) {
                second = (0, constants_1.jaStringToNumber)(match[SECOND_GROUP]);
            }
            if (second >= 60)
                return null;
            result.start.assign("second", second);
        }
        hour = parseInt((0, constants_1.toHankaku)(match[HOUR_GROUP]));
        if (isNaN(hour)) {
            hour = (0, constants_1.jaStringToNumber)(match[HOUR_GROUP]);
        }
        if (match[MINUTE_GROUP]) {
            if (match[MINUTE_GROUP] === "半") {
                minute = 30;
            }
            else {
                minute = parseInt((0, constants_1.toHankaku)(match[MINUTE_GROUP]));
                if (isNaN(minute)) {
                    minute = (0, constants_1.jaStringToNumber)(match[MINUTE_GROUP]);
                }
            }
        }
        else if (hour > 100) {
            minute = hour % 100;
            hour = Math.floor(hour / 100);
        }
        if (minute >= 60) {
            return null;
        }
        if (hour > 24) {
            return null;
        }
        if (hour >= 12) {
            meridiem = types_1.Meridiem.PM;
        }
        if (match[AM_PM_HOUR_GROUP_1]) {
            if (hour > 12)
                return null;
            const AMPMString = match[AM_PM_HOUR_GROUP_1];
            const FirstAMPMString = AMPMString[0].toLowerCase();
            if (AMPMString === "午前" || FirstAMPMString === "a") {
                meridiem = types_1.Meridiem.AM;
                if (hour === 12)
                    hour = 0;
            }
            else if (AMPMString === "午後" || FirstAMPMString === "p") {
                meridiem = types_1.Meridiem.PM;
                if (hour != 12)
                    hour += 12;
            }
        }
        else if (match[AM_PM_HOUR_GROUP_2]) {
            if (hour > 12)
                return null;
            const ampm = match[AM_PM_HOUR_GROUP_2][0].toLowerCase();
            if (ampm === "a") {
                meridiem = types_1.Meridiem.AM;
                if (hour === 12)
                    hour = 0;
            }
            if (ampm === "p") {
                meridiem = types_1.Meridiem.PM;
                if (hour != 12)
                    hour += 12;
            }
        }
        result.start.assign("hour", hour);
        result.start.assign("minute", minute);
        if (meridiem >= 0) {
            result.start.assign("meridiem", meridiem);
        }
        else {
            if (hour < 12) {
                result.start.imply("meridiem", 0);
            }
            else {
                result.start.imply("meridiem", 1);
            }
        }
        match = SECOND_REG_PATTERN.exec(context.text.substring(result.index + result.text.length));
        if (!match) {
            if (result.text.match(/^\d+$/)) {
                return null;
            }
            return result;
        }
        result.end = context.createParsingComponents();
        hour = 0;
        minute = 0;
        meridiem = -1;
        if (match[SECOND_GROUP]) {
            let second = parseInt((0, constants_1.toHankaku)(match[SECOND_GROUP]));
            if (isNaN(second)) {
                second = (0, constants_1.jaStringToNumber)(match[SECOND_GROUP]);
            }
            if (second >= 60)
                return null;
            result.end.assign("second", second);
        }
        hour = parseInt((0, constants_1.toHankaku)(match[HOUR_GROUP]));
        if (isNaN(hour)) {
            hour = (0, constants_1.jaStringToNumber)(match[HOUR_GROUP]);
        }
        if (match[MINUTE_GROUP]) {
            if (match[MINUTE_GROUP] === "半") {
                minute = 30;
            }
            else {
                minute = parseInt((0, constants_1.toHankaku)(match[MINUTE_GROUP]));
                if (isNaN(minute)) {
                    minute = (0, constants_1.jaStringToNumber)(match[MINUTE_GROUP]);
                }
            }
        }
        else if (hour > 100) {
            minute = hour % 100;
            hour = Math.floor(hour / 100);
        }
        if (minute >= 60) {
            return null;
        }
        if (hour > 24) {
            return null;
        }
        if (hour >= 12) {
            meridiem = types_1.Meridiem.PM;
        }
        if (match[AM_PM_HOUR_GROUP_1]) {
            if (hour > 12)
                return null;
            const AMPMString = match[AM_PM_HOUR_GROUP_1];
            const FirstAMPMString = AMPMString[0].toLowerCase();
            if (AMPMString === "午前" || FirstAMPMString === "a") {
                meridiem = types_1.Meridiem.AM;
                if (hour === 12)
                    hour = 0;
            }
            else if (AMPMString === "午後" || FirstAMPMString === "p") {
                meridiem = types_1.Meridiem.PM;
                if (hour != 12)
                    hour += 12;
            }
            if (!result.start.isCertain("meridiem")) {
                if (meridiem === types_1.Meridiem.AM) {
                    result.start.imply("meridiem", types_1.Meridiem.AM);
                    if (result.start.get("hour") === 12) {
                        result.start.assign("hour", 0);
                    }
                }
                else {
                    result.start.imply("meridiem", 1);
                    if (result.start.get("hour") != 12) {
                        result.start.assign("hour", result.start.get("hour") + 12);
                    }
                }
            }
        }
        else if (match[AM_PM_HOUR_GROUP_2]) {
            if (hour > 12)
                return null;
            const ampm = match[AM_PM_HOUR_GROUP_2][0].toLowerCase();
            if (ampm === "a") {
                meridiem = types_1.Meridiem.AM;
                if (hour === 12)
                    hour = 0;
            }
            if (ampm === "p") {
                meridiem = types_1.Meridiem.PM;
                if (hour != 12)
                    hour += 12;
            }
        }
        result.text = result.text + match[0];
        result.end.assign("hour", hour);
        result.end.assign("minute", minute);
        if (meridiem >= 0) {
            result.end.assign("meridiem", meridiem);
        }
        else {
            const startAtPM = result.start.isCertain("meridiem") && result.start.get("hour") > 12;
            if (startAtPM) {
                if (result.start.get("hour") - 12 > hour) {
                    result.end.imply("meridiem", types_1.Meridiem.AM);
                }
                else if (hour <= 12) {
                    result.end.assign("hour", hour + 12);
                    result.end.assign("meridiem", types_1.Meridiem.PM);
                }
            }
            else if (hour > 12) {
                result.end.imply("meridiem", types_1.Meridiem.PM);
            }
            else if (hour <= 12) {
                result.end.imply("meridiem", types_1.Meridiem.AM);
            }
        }
        if (result.end.date().getTime() < result.start.date().getTime()) {
            result.end.imply("day", result.end.get("day") + 1);
        }
        return result;
    }
}
exports.default = JPTimeExpressionParser;
//# sourceMappingURL=JPTimeExpressionParser.js.map