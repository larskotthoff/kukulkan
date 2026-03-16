export declare const DATA_HYDRATION_KEY = "data-hk";
export declare const SOLID_DEV_GLOBAL = "Solid$$";
/**
Detects if SolidJS is present on the page. In either development or production mode.
*/
export declare function detectSolid(): Promise<boolean>;
export declare function check_for_solid(): Promise<boolean>;
export declare function detectSolidDev(): boolean;
export declare function onSolidDevDetect(callback: () => void): void;
export declare const SOLID_DEVTOOLS_GLOBAL = "SolidDevtools$$";
export declare function detectSolidDevtools(): boolean;
export declare function onSolidDevtoolsDetect(callback: () => void): void;
//# sourceMappingURL=detect.d.ts.map