'use strict';

var web = require('solid-js/web');

// src/index.ts
var w = web.isServer ? { document: {}, navigator: { userAgent: "" } } : window;
var n = w.navigator;
var ua = n.userAgent;
exports.isAndroid = /* @__PURE__ */ /Android/.test(ua);
exports.isWindows = /* @__PURE__ */ /(win32|win64|windows|wince)/i.test(ua);
exports.isMac = /* @__PURE__ */ /(macintosh|macintel|macppc|mac68k|macos)/i.test(ua);
exports.isIPhone = /* @__PURE__ */ /iphone/i.test(ua);
exports.isIPad = /* @__PURE__ */ /ipad/i.test(ua) && n.maxTouchPoints > 1;
exports.isIPod = /* @__PURE__ */ /ipod/i.test(ua);
exports.isIOS = exports.isIPhone || exports.isIPad || exports.isIPod;
exports.isAppleDevice = exports.isIOS || exports.isMac;
exports.isMobile = /* @__PURE__ */ /Mobi/.test(ua);
exports.isFirefox = /* @__PURE__ */ /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(ua);
exports.isOpera = !!w.opr && !!w.opr.addons || !!w.opera || /* @__PURE__ */ / OPR\//.test(ua);
exports.isSafari = !!n.vendor && n.vendor.includes("Apple") && ua && !ua.includes("CriOS") && !ua.includes("FxiOS");
exports.isIE = !!w.document.documentMode;
exports.isChromium = !!w.chrome;
exports.isEdge = /* @__PURE__ */ /Edg/.test(ua) && exports.isChromium;
exports.isChrome = exports.isChromium && n.vendor === "Google Inc." && !exports.isOpera && !exports.isEdge;
exports.isBrave = !!n.brave && n.brave.isBrave && n.brave.isBrave.name === "isBrave";
exports.isGecko = /* @__PURE__ */ /Gecko\/[0-9.]+/.test(ua);
exports.isBlink = /* @__PURE__ */ /Chrome\/[0-9.]+/.test(ua);
exports.isWebKit = /* @__PURE__ */ /AppleWebKit\/[0-9.]+/.test(ua) && !exports.isBlink;
exports.isPresto = /* @__PURE__ */ /Opera\/[0-9.]+/.test(ua);
exports.isTrident = /* @__PURE__ */ /Trident\/[0-9.]+/.test(ua);
exports.isEdgeHTML = /* @__PURE__ */ /Edge\/[0-9.]+/.test(ua);
