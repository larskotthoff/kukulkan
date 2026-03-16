import type { Prettify, UnionToIntersection } from '@nothing-but/utils/types';
export declare const fontSize: {
    readonly xs: "0.5rem";
    readonly sm: "0.625rem";
    readonly base: "0.75rem";
    readonly lg: "0.875rem";
    readonly xl: "1rem";
    readonly '2xl': "1.125rem";
    readonly '3xl': "1.25rem";
};
export declare const lineHeight: {
    readonly '3xs': "1rem";
    readonly '2xs': "1rem";
    readonly xs: "1rem";
    readonly sm: "1.25rem";
    readonly base: "1.5rem";
    readonly lg: "1.75rem";
    readonly xl: "1.75rem";
    readonly '2xl': "2rem";
    readonly '3xl': "2.25rem";
    readonly '4xl': "2.5rem";
    readonly '5xl': "1";
    readonly '6xl': "1";
};
declare const raw_spacing_with_custom: {
    header_height: "1.75rem";
    inspector_row: "1.125rem";
    px: "1px";
    0: "0";
    0.25: "0.0625rem";
    0.5: "0.125rem";
    1: "0.25rem";
    1.5: "0.375rem";
    2: "0.5rem";
    2.5: "0.625rem";
    3: "0.75rem";
    3.5: "0.875rem";
    4: "1rem";
    4.5: "1.125rem";
    5: "1.25rem";
    6: "1.5rem";
    7: "1.75rem";
    8: "2rem";
    9: "2.25rem";
    10: "2.5rem";
    11: "2.75rem";
    12: "3rem";
    14: "3.5rem";
    16: "4rem";
    20: "5rem";
    24: "6rem";
    28: "7rem";
    32: "8rem";
    36: "9rem";
    40: "10rem";
    44: "11rem";
    48: "12rem";
    52: "13rem";
    56: "14rem";
    60: "15rem";
    64: "16rem";
    72: "18rem";
    80: "20rem";
    96: "24rem";
};
export type Spacing = Prettify<UnionToIntersection<{
    [K in keyof typeof raw_spacing_with_custom]: {
        [K2 in `-${K}`]: `-${(typeof raw_spacing_with_custom)[K]}`;
    } & {
        [K2 in K]: (typeof raw_spacing_with_custom)[K];
    };
}[keyof typeof raw_spacing_with_custom]>>;
export declare const spacing: Spacing;
export declare function remValue(value: `${number}rem`): number;
export interface Var {
    name: string;
    light: string;
    dark: string;
}
export declare const vars: {
    readonly panel: {
        readonly 1: string;
        readonly 2: string;
        readonly 3: string;
        readonly 4: string;
        readonly 5: string;
        readonly 6: string;
        readonly 7: string;
        readonly 8: string;
        readonly bg: string;
        readonly border: string;
    };
    readonly highlight: {
        readonly bg: string;
        readonly border: string;
    };
    readonly disabled: string;
    readonly text: {
        readonly DEFAULT: string;
        readonly light: string;
    };
    readonly component: string;
    readonly dom: string;
};
export declare function make_var_styles(root_class: string): string;
export declare const colors: {
    panel: {
        readonly 1: string;
        readonly 2: string;
        readonly 3: string;
        readonly 4: string;
        readonly 5: string;
        readonly 6: string;
        readonly 7: string;
        readonly 8: string;
        readonly bg: string;
        readonly border: string;
    };
    highlight: {
        readonly bg: string;
        readonly border: string;
    };
    disabled: string;
    text: {
        readonly DEFAULT: string;
        readonly light: string;
    };
    component: string;
    dom: string;
    inherit: string;
    current: string;
    transparent: string;
    black: string;
    white: string;
    cyan: {
        readonly 50: "#ecfeff";
        readonly 100: "#cffafe";
        readonly 200: "#a5f3fc";
        readonly 300: "#67e8f9";
        readonly 400: "#22d3ee";
        readonly 500: "#06b6d4";
        readonly 600: "#0891b2";
        readonly 700: "#0e7490";
        readonly 800: "#155e75";
        readonly 900: "#164e63";
    };
    amber: {
        readonly 50: "#fffbeb";
        readonly 100: "#fef3c7";
        readonly 200: "#fde68a";
        readonly 300: "#fcd34d";
        readonly 400: "#fbbf24";
        readonly 500: "#f59e0b";
        readonly 600: "#d97706";
        readonly 700: "#b45309";
        readonly 800: "#92400e";
        readonly 900: "#78350f";
    };
    gray: {
        readonly 50: "#fafafa";
        readonly 100: "#f4f4f5";
        readonly 200: "#e4e4e7";
        readonly 300: "#d4d4d8";
        readonly 400: "#a1a1aa";
        readonly 500: "#71717a";
        readonly 600: "#52525b";
        readonly 700: "#3f3f46";
        readonly 800: "#27272a";
        readonly 900: "#18181b";
    };
    green: string;
    red: string;
};
export declare const easing: {
    DEFAULT: string;
    linear: string;
    in: string;
    out: string;
    'in-out': string;
};
export declare const radius: {
    none: string;
    sm: string;
    DEFAULT: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
};
export declare const duration: {
    0: string;
    75: string;
    100: string;
    150: string;
    200: string;
    300: string;
    500: string;
    700: string;
    1000: string;
};
export declare const font: {
    sans: string;
    serif: string;
    mono: string;
};
export {};
//# sourceMappingURL=theme.d.ts.map