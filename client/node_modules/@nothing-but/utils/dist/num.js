export function random(max) {
    return Math.random() * max;
}
export function random_from(min, max) {
    return Math.random() * (max - min) + min;
}
export function random_int(max) {
    return Math.floor(Math.random() * max);
}
export function random_int_from(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
export function remainder(a, b) {
    return ((a % b) + b) % b;
}
export function wrap(value, min, max) {
    return remainder(value - min, max - min) + min;
}
export function wrapIndex(index, length) {
    return wrap(index, 0, length);
}
export function bounce(value, min, max) {
    const range = max - min, rem = wrap(value - min, 0, 2 * range), distance = Math.abs(rem - range);
    return max - distance;
}
/**
 Because sometimes `n - Number.EPSILON == n`
*/
export function find_open_upper_bound(max) {
    let m = 0, n = max;
    while (max === n)
        n = max - Number.EPSILON * (++m);
    return n;
}
/**
 Linear interpolation

 @param start Start value
 @param end   End value
 @param t     Interpolation factor

 ```ts
 start + (end - start) * t
 ```
*/
export function lerp(start, end, t) {
    return start + (end - start) * t;
}
export function map_range(value, in_min, in_max, out_min, out_max) {
    return ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}
export function to_percent(value, min, max) {
    return (value - min) / (max - min);
}
/**
 * Symmetric round see
 * https://www.npmjs.com/package/round-half-up-symmetric#user-content-detailed-background
 *
 * @param a value to round
 */
export function round(a) {
    return a >= 0 || a % 0.5 !== 0 ? Math.round(a) : Math.floor(a);
}
const DEGREE = Math.PI / 180;
/**
 * Convert Degree To Radian
 *
 * @param a Angle in Degrees
 */
export function to_radian(a) {
    return a * DEGREE;
}
/**
 * Convert Radian To Degree
 *
 * @param a Angle in Radians
 */
export function to_degree(a) {
    return a / DEGREE;
}
/**
 * Tests whether or not the arguments have approximately the same value, within an absolute or
 * relative tolerance of Number.EPSILON (an absolute tolerance is used for values less than or equal
 * to 1.0, and a relative tolerance is used for larger values)
 *
 * @param   a The first number to test.
 * @param   b The second number to test.
 * @returns   True if the numbers are approximately equal, false otherwise.
 */
export function equals(a, b) {
    return Math.abs(a - b) <= Number.EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
}
export function between(a, b, c) {
    if (a > c)
        [a, c] = [c, a];
    return a - Number.EPSILON <= b && b <= c + Number.EPSILON;
}
export function ranges_intersecting(a1, b1, a2, b2) {
    if (a1 > b1)
        [a1, b1] = [b1, a1];
    if (a2 > b2)
        [a2, b2] = [b2, a2];
    return a1 <= b2 && a2 <= b1;
}
