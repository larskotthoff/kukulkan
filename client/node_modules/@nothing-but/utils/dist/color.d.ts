export type HSL = [hue: number, saturation: number, lightness: number];
export declare function hsl_zero(): HSL;
export declare function hsl(hue: number, saturation: number, lightness: number): HSL;
export declare function hsl_to_string(c: HSL): string;
export declare function hsl_to_hsla_string(c: HSL, alpha: number): string;
export declare function mix(a: HSL, b: HSL, ar: number, br: number): HSL;
/** Represents a color in the RGB color space. */
export declare class RGB {
    r: number;
    g: number;
    b: number;
    /**
     * Creates an instance of the RGB class.
     *
     * @param r - The red component of the RGB color.
     * @param g - The green component of the RGB color.
     * @param b - The blue component of the RGB color.
     */
    constructor(r: number, g: number, b: number);
    /** Returns a string representation of the RGB color in the format "rgb(r g b)". */
    toString: () => string;
}
/** Represents a color in the RGBA color space. Extends the RGB class and adds an alpha component. */
export declare class RGBA extends RGB {
    a: number;
    /**
     * Creates an instance of the RGBA class.
     *
     * @param r - The red component of the RGBA color.
     * @param g - The green component of the RGBA color.
     * @param b - The blue component of the RGBA color.
     * @param a - The alpha component (opacity) of the RGBA color.
     */
    constructor(r: number, g: number, b: number, a: number);
    /** Returns a string representation of the RGBA color in the format "rgb(r g b / a)". */
    toString: () => string;
}
/**
 * Converts an RGB color to a string representation.
 *
 * @param   rgb - The RGB color to be converted.
 * @returns     A string in the format "rgb(r g b)" representing the RGB color.
 */
export declare function rgb_to_string(rgb: RGB): string;
/**
 * Converts an RGBA color to a string representation.
 *
 * @param   rgba - The RGBA color to be converted.
 * @returns      A string in the format "rgb(r g b / a)" representing the RGBA color.
 */
export declare function rgba_to_string(rgba: RGBA): string;
/**
 * Converts an RGB color to an RGBA color with the specified alpha component.
 *
 * @param   rgb - The RGB color to be converted.
 * @param   a   - The alpha component (opacity) of the resulting RGBA color.
 * @returns     A new RGBA color with the same RGB components and the specified alpha.
 */
export declare function rgb_to_rgba(rgb: RGB, a: number): RGBA;
/**
 * Converts an RGB color to a numeric representation (32-bit integer).
 *
 * @param   rgb - The RGB color to be converted.
 * @returns     A numeric value representing the RGB color.
 */
export declare function rgb_int(rgb: RGB): number;
/**
 * Converts a numeric representation (32-bit integer) to an RGB color.
 *
 * @param   value - The numeric value representing the RGB color.
 * @returns       A new RGB color with components extracted from the numeric value.
 */
export declare function rgb_int_to_rgb(value: number): RGB;
/**
 * Converts an RGBA color to a numeric representation (32-bit integer).
 *
 * @param   rgba - The RGBA color to be converted.
 * @returns      A numeric value representing the RGBA color.
 */
export declare function rgba_int(rgba: RGBA): number;
/**
 * Converts a numeric representation (32-bit integer) to an RGBA color.
 *
 * @param   value - The numeric value representing the RGBA color.
 * @returns       A new RGBA color with components extracted from the numeric value.
 */
export declare function rgba_int_to_rgba(value: number): RGBA;
/**
 * Converts an RGB color and an alpha component to a numeric representation (32-bit integer).
 *
 * @param   rgb - The RGB color to be converted.
 * @param   a   - The alpha component (opacity) of the resulting RGBA color.
 * @returns     A numeric value representing the RGBA color with the specified alpha.
 */
export declare function rgb_to_rgba_int(rgb: RGB, a: number): number;
/**
 * Converts an RGB color to a CSS-compatible string representation.
 *
 * @param   rgb - The RGB color to be converted.
 * @returns     A string in the format "r g b" representing the RGB color.
 */
export declare function rgb_value(rgb: RGB): string;
/**
 * Converts an RGB color to a hexadecimal string representation.
 *
 * @param   rgb - The RGB color to be converted.
 * @returns     A string in the format "#rrggbb" representing the RGB color in hexadecimal notation.
 */
export declare function rgb_to_hex(rgb: RGB): string;
/**
 * Converts an RGBA color to a hexadecimal string representation.
 *
 * @param   rgba - The RGBA color to be converted.
 * @returns      A string in the format "#rrggbbaa" representing the RGBA color in hexadecimal
 *   notation.
 */
export declare function rgba_to_hex(rgba: RGBA): string;
/**
 * Converts a hex color to an rgb color
 *
 * @example hex_to_rgb('#ff0000') // { r: 255, g: 0, b: 0 } hex_to_rgb('#f00') // { r: 255, g: 0, b: 0
 * }
 */
export declare function hex_to_rgb(hex: string): RGB;
/**
 * Converts a hex color to an rgba color
 *
 * @example hex_to_rgba('#ff0000') // { r: 255, g: 0, b: 0, a: 1 } hex_to_rgba('#ff000000') // { r: 255,
 * g: 0, b: 0, a: 0 } hex_to_rgba('#f00') // { r: 255, g: 0, b: 0, a: 1 } hex_to_rgba('#f000') // { r:
 * 255, g: 0, b: 0, a: 0 }
 */
export declare function hex_to_rgba(hex: string): RGBA;
//# sourceMappingURL=color.d.ts.map