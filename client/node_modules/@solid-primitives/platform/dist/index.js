import { isServer } from 'solid-js/web';

// src/index.ts
var w = isServer ? { document: {}, navigator: { userAgent: "" } } : window;
var n = w.navigator;
var ua = n.userAgent;
var isAndroid = /* @__PURE__ */ /Android/.test(ua);
var isWindows = /* @__PURE__ */ /(win32|win64|windows|wince)/i.test(ua);
var isMac = /* @__PURE__ */ /(macintosh|macintel|macppc|mac68k|macos)/i.test(ua);
var isIPhone = /* @__PURE__ */ /iphone/i.test(ua);
var isIPad = /* @__PURE__ */ /ipad/i.test(ua) && n.maxTouchPoints > 1;
var isIPod = /* @__PURE__ */ /ipod/i.test(ua);
var isIOS = isIPhone || isIPad || isIPod;
var isAppleDevice = isIOS || isMac;
var isMobile = /* @__PURE__ */ /Mobi/.test(ua);
var isFirefox = /* @__PURE__ */ /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(ua);
var isOpera = !!w.opr && !!w.opr.addons || !!w.opera || /* @__PURE__ */ / OPR\//.test(ua);
var isSafari = !!n.vendor && n.vendor.includes("Apple") && ua && !ua.includes("CriOS") && !ua.includes("FxiOS");
var isIE = !!w.document.documentMode;
var isChromium = !!w.chrome;
var isEdge = /* @__PURE__ */ /Edg/.test(ua) && isChromium;
var isChrome = isChromium && n.vendor === "Google Inc." && !isOpera && !isEdge;
var isBrave = !!n.brave && n.brave.isBrave && n.brave.isBrave.name === "isBrave";
var isGecko = /* @__PURE__ */ /Gecko\/[0-9.]+/.test(ua);
var isBlink = /* @__PURE__ */ /Chrome\/[0-9.]+/.test(ua);
var isWebKit = /* @__PURE__ */ /AppleWebKit\/[0-9.]+/.test(ua) && !isBlink;
var isPresto = /* @__PURE__ */ /Opera\/[0-9.]+/.test(ua);
var isTrident = /* @__PURE__ */ /Trident\/[0-9.]+/.test(ua);
var isEdgeHTML = /* @__PURE__ */ /Edge\/[0-9.]+/.test(ua);

export { isAndroid, isAppleDevice, isBlink, isBrave, isChrome, isChromium, isEdge, isEdgeHTML, isFirefox, isGecko, isIE, isIOS, isIPad, isIPhone, isIPod, isMac, isMobile, isOpera, isPresto, isSafari, isTrident, isWebKit, isWindows };
