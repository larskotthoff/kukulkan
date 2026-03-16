import ExtractTimezoneAbbrRefiner from "./common/refiners/ExtractTimezoneAbbrRefiner.js";
import ExtractTimezoneOffsetRefiner from "./common/refiners/ExtractTimezoneOffsetRefiner.js";
import OverlapRemovalRefiner from "./common/refiners/OverlapRemovalRefiner.js";
import ForwardDateRefiner from "./common/refiners/ForwardDateRefiner.js";
import UnlikelyFormatFilter from "./common/refiners/UnlikelyFormatFilter.js";
import ISOFormatParser from "./common/parsers/ISOFormatParser.js";
import MergeWeekdayComponentRefiner from "./common/refiners/MergeWeekdayComponentRefiner.js";
export function includeCommonConfiguration(configuration, strictMode = false) {
    configuration.parsers.unshift(new ISOFormatParser());
    configuration.refiners.unshift(new MergeWeekdayComponentRefiner());
    configuration.refiners.unshift(new ExtractTimezoneOffsetRefiner());
    configuration.refiners.unshift(new OverlapRemovalRefiner());
    configuration.refiners.push(new ExtractTimezoneAbbrRefiner());
    configuration.refiners.push(new OverlapRemovalRefiner());
    configuration.refiners.push(new ForwardDateRefiner());
    configuration.refiners.push(new UnlikelyFormatFilter(strictMode));
    return configuration;
}
//# sourceMappingURL=configurations.js.map