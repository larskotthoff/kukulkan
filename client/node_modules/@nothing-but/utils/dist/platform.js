const w = typeof document === "undefined"
    ? { document: {}, navigator: { userAgent: "" } }
    : window;
const n = w.navigator;
const ua = n.userAgent;
/*

    Devices

*/
/** Is Android Device */
export const is_android = /*#__PURE__*/ /Android/.test(ua);
export const IS_ANDROID = is_android;
/** Is Windows Device */
export const is_windows = /*#__PURE__*/ /(win32|win64|windows|wince)/i.test(ua);
export const IS_WINDOWS = is_windows;
/** Is Mac Device */
export const is_mac = /*#__PURE__*/ /(macintosh|macintel|macppc|mac68k|macos)/i.test(ua);
export const IS_MAC = is_mac;
/** Is IPhone Device */
export const is_iphone = /*#__PURE__*/ /iphone/i.test(ua);
export const IS_IPHONE = is_iphone;
/** Is IPad Device */
export const is_ipad = /*#__PURE__*/ /ipad/i.test(ua) && n.maxTouchPoints > 1;
export const IS_IPAD = is_ipad;
/** Is IPod Device */
export const is_ipod = /*#__PURE__*/ /ipod/i.test(ua);
export const IS_IPOD = is_ipod;
/** Is IOS Device */
export const is_ios = is_iphone || is_ipad || is_ipod;
export const IS_IOS = is_ios;
/** Is Apple Device */
export const is_apple = is_ios || is_mac;
export const IS_APPLE = is_apple;
/** is a Mobile Browser */
export const is_mobile = /*#__PURE__*/ /Mobi/.test(ua);
export const IS_MOBILE = is_mobile;
/*

    Browsers

*/
/** Browser is Mozilla Firefox */
export const is_firefox = /*#__PURE__*/ /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(ua);
export const IS_FIREFOX = is_firefox;
/** Browser is Opera */
export const is_opera = (!!w.opr && !!w.opr.addons) || !!w.opera || /*#__PURE__*/ / OPR\//.test(ua);
export const IS_OPERA = is_opera;
/** Browser is Safari */
export const is_safari = !!(n.vendor &&
    n.vendor.includes("Apple") &&
    ua &&
    !ua.includes("CriOS") &&
    !ua.includes("FxiOS"));
export const IS_SAFARI = is_safari;
/** Browser is Internet Explorer 6-11 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const is_ie = /*@cc_on!@*/ false || !!w.document.documentMode;
export const IS_IE = is_ie;
/** is Chromium-based browser */
export const is_chromium = !!w.chrome;
export const IS_CHROMIUM = is_chromium;
/** Browser is Edge */
export const is_edge = /*#__PURE__*/ /Edg/.test(ua) && is_chromium;
export const IS_EDGE = is_edge;
/** Browser is Chrome */
export const is_chrome = is_chromium && n.vendor === "Google Inc." && !is_opera && !is_edge;
export const IS_CHROME = is_chrome;
/** Browser is Brave */
export const is_brave = !!(n.brave &&
    n.brave.isBrave &&
    n.brave.isBrave.name === "isBrave");
export const IS_BRAVE = is_brave;
/*

    Rendering Engines

*/
/** Browser using Gecko Rendering Engine */
export const is_gecko = /*#__PURE__*/ /Gecko\/[0-9.]+/.test(ua);
export const IS_GECKO = is_gecko;
/** Browser using Blink Rendering Engine */
export const is_blink = /*#__PURE__*/ /Chrome\/[0-9.]+/.test(ua);
export const IS_BLINK = is_blink;
/** Browser using WebKit Rendering Engine */
export const is_webkit = /*#__PURE__*/ /AppleWebKit\/[0-9.]+/.test(ua) && !is_blink;
export const IS_WEBKIT = is_webkit;
/** Browser using Presto Rendering Engine */
export const is_presto = /*#__PURE__*/ /Opera\/[0-9.]+/.test(ua);
export const IS_PRESTO = is_presto;
/** Browser using Trident Rendering Engine */
export const is_trident = /*#__PURE__*/ /Trident\/[0-9.]+/.test(ua);
export const IS_TRIDENT = is_trident;
/** Browser using EdgeHTML Rendering Engine */
export const is_edge_html = /*#__PURE__*/ /Edge\/[0-9.]+/.test(ua);
export const IS_EDGE_HTML = is_edge_html;
