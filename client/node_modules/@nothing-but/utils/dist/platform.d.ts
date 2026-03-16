declare global {
    interface Window {
        chrome?: unknown;
        opera?: unknown;
        opr?: {
            addons: unknown;
        };
    }
    interface Document {
        documentMode?: unknown;
    }
    interface Navigator {
        brave?: {
            isBrave?: () => unknown;
        };
    }
}
/** Is Android Device */
export declare const is_android: boolean;
export declare const IS_ANDROID: boolean;
/** Is Windows Device */
export declare const is_windows: boolean;
export declare const IS_WINDOWS: boolean;
/** Is Mac Device */
export declare const is_mac: boolean;
export declare const IS_MAC: boolean;
/** Is IPhone Device */
export declare const is_iphone: boolean;
export declare const IS_IPHONE: boolean;
/** Is IPad Device */
export declare const is_ipad: boolean;
export declare const IS_IPAD: boolean;
/** Is IPod Device */
export declare const is_ipod: boolean;
export declare const IS_IPOD: boolean;
/** Is IOS Device */
export declare const is_ios: boolean;
export declare const IS_IOS: boolean;
/** Is Apple Device */
export declare const is_apple: boolean;
export declare const IS_APPLE: boolean;
/** is a Mobile Browser */
export declare const is_mobile: boolean;
export declare const IS_MOBILE: boolean;
/** Browser is Mozilla Firefox */
export declare const is_firefox: boolean;
export declare const IS_FIREFOX: boolean;
/** Browser is Opera */
export declare const is_opera: boolean;
export declare const IS_OPERA: boolean;
/** Browser is Safari */
export declare const is_safari: boolean;
export declare const IS_SAFARI: boolean;
/** Browser is Internet Explorer 6-11 */
export declare const is_ie: boolean;
export declare const IS_IE: boolean;
/** is Chromium-based browser */
export declare const is_chromium: boolean;
export declare const IS_CHROMIUM: boolean;
/** Browser is Edge */
export declare const is_edge: boolean;
export declare const IS_EDGE: boolean;
/** Browser is Chrome */
export declare const is_chrome: boolean;
export declare const IS_CHROME: boolean;
/** Browser is Brave */
export declare const is_brave: boolean;
export declare const IS_BRAVE: boolean;
/** Browser using Gecko Rendering Engine */
export declare const is_gecko: boolean;
export declare const IS_GECKO: boolean;
/** Browser using Blink Rendering Engine */
export declare const is_blink: boolean;
export declare const IS_BLINK: boolean;
/** Browser using WebKit Rendering Engine */
export declare const is_webkit: boolean;
export declare const IS_WEBKIT: boolean;
/** Browser using Presto Rendering Engine */
export declare const is_presto: boolean;
export declare const IS_PRESTO: boolean;
/** Browser using Trident Rendering Engine */
export declare const is_trident: boolean;
export declare const IS_TRIDENT: boolean;
/** Browser using EdgeHTML Rendering Engine */
export declare const is_edge_html: boolean;
export declare const IS_EDGE_HTML: boolean;
//# sourceMappingURL=platform.d.ts.map