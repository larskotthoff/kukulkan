export declare function random(max: number): number;
export declare function random_from(min: number, max: number): number;
export declare function random_int(max: number): number;
export declare function random_int_from(min: number, max: number): number;
export declare function clamp(value: number, min: number, max: number): number;
export declare function remainder(a: number, b: number): number;
export declare function wrap(value: number, min: number, max: number): number;
export declare function wrapIndex(index: number, length: number): number;
export declare function bounce(value: number, min: number, max: number): number;
/**
 Because sometimes `n - Number.EPSILON == n`
*/
export declare function find_open_upper_bound(max: number): number;
/**
 Linear interpolation

 @param start Start value
 @param end   End value
 @param t     Interpolation factor

 ```ts
 start + (end - start) * t
 ```
*/
export declare function lerp(start: number, end: number, t: number): number;
export declare function map_range(value: number, in_min: number, in_max: number, out_min: number, out_max: number): number;
export declare function to_percent(value: number, min: number, max: number): number;
/**
 * Symmetric round see
 * https://www.npmjs.com/package/round-half-up-symmetric#user-content-detailed-background
 *
 * @param a value to round
 */
export declare function round(a: number): number;
/**
 * Convert Degree To Radian
 *
 * @param a Angle in Degrees
 */
export declare function to_radian(a: number): number;
/**
 * Convert Radian To Degree
 *
 * @param a Angle in Radians
 */
export declare function to_degree(a: number): number;
/**
 * Tests whether or not the arguments have approximately the same value, within an absolute or
 * relative tolerance of Number.EPSILON (an absolute tolerance is used for values less than or equal
 * to 1.0, and a relative tolerance is used for larger values)
 *
 * @param   a The first number to test.
 * @param   b The second number to test.
 * @returns   True if the numbers are approximately equal, false otherwise.
 */
export declare function equals(a: number, b: number): boolean;
export declare function between(a: number, b: number, c: number): boolean;
export declare function ranges_intersecting(a1: number, b1: number, a2: number, b2: number): boolean;
//# sourceMappingURL=num.d.ts.map