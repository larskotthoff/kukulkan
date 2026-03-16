/** Represents a 2D vector with x and y components. */
export class Vector {
    x;
    y;
    constructor(x, y) {
        if (typeof x === "string") {
            const [xStr, yStr] = x.slice(1, -1).split(", ");
            x = Number(xStr);
            y = Number(yStr);
        }
        else if (typeof x === "object") {
            y = x.y;
            x = x.x;
        }
        this.x = x;
        this.y = y ?? x;
    }
    *[Symbol.iterator]() {
        yield this.x;
        yield this.y;
    }
    toString() {
        return `(${this.x}, ${this.y})`;
    }
    toJSON() {
        return { x: this.x, y: this.y };
    }
}
/** Creates a new vector instance. */
export const vector = (...args) => new Vector(...args);
/** A constant vector representing the zero vector. */
export const ZERO = vector(0, 0);
/**
 * Creates a new vector instance representing the zero vector.
 *
 * @returns A vector instance representing the zero vector.
 */
export function zero() {
    return vector(0, 0);
}
/** Checks if two vectors are equal. */
export function equals(a, b) {
    return a.x === b.x && a.y === b.y;
}
export function normalize(p) {
    let len = Math.hypot(p.x, p.y);
    p.x /= len;
    p.y /= len;
}
/** Subtracts a vector from another vector in place. The first vector is **mutated**. */
export function subtract(a, b) {
    a.x -= b.x;
    a.y -= b.y;
}
/**
 * Calculates the difference between two vectors.
 *
 * @returns The difference vector.
 */
export function difference(a, b) {
    return vector(a.x - b.x, a.y - b.y);
}
export function add(vec, x, y) {
    if (typeof x === "number") {
        vec.x += x;
        vec.y += y ?? x;
        return;
    }
    if (x instanceof Force) {
        x = force_to_vector(x);
    }
    vec.x += x.x;
    vec.y += x.y;
}
/**
 * Calculates the sum of two vectors.
 *
 * @returns The sum vector.
 */
export function sum(a, b) {
    return vector(a.x + b.x, a.y + b.y);
}
/** Multiplies a vector by another vector or a scalar in place. The first vector is **mutated**. */
export function multiply(a, b) {
    if (typeof b === "number") {
        a.x *= b;
        a.y *= b;
        return;
    }
    a.x *= b.x;
    a.y *= b.y;
}
/**
 * Calculates the product of two vectors.
 *
 * @returns The product vector.
 */
export function product(a, b) {
    if (typeof b === "number") {
        return vector(a.x * b, a.y * b);
    }
    return vector(a.x * b.x, a.y * b.y);
}
/** Divides a vector by another vector in place. The first vector is **mutated**. */
export function divide(a, b) {
    a.x /= b.x;
    a.y /= b.y;
}
/**
 * Calculates the quotient of two vectors. (The first vector is divided by the second vector.)
 *
 * @returns The quotient vector.
 */
export function quotient(a, b) {
    return vector(a.x / b.x, a.y / b.y);
}
export function map(vec, fn) {
    return vector(fn(vec.x), fn(vec.y));
}
export function mut(vec, fn) {
    vec.x = fn(vec.x);
    vec.y = fn(vec.y);
}
/**
 Calculates the distance between two vectors.

 @returns The distance between the vectors.
*/
export function distance(a, b) {
    let x = a.x - b.x;
    let y = a.y - b.y;
    return Math.sqrt(x * x + y * y);
}
export function distance_xy(ax, ay, bx, by) {
    let x = ax - bx;
    let y = ay - by;
    return Math.sqrt(x * x + y * y);
}
export function average(...vectors) {
    let x = 0, y = 0;
    for (let vec of vectors) {
        x += vec.x;
        y += vec.y;
    }
    return vector(x / vectors.length, y / vectors.length);
}
/**
 * Calculates the angle between two vectors.
 *
 * @returns The angle between the vectors in radians.
 */
export function angle(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
}
/**
 * Rotates the {@link point} vector by {@link rad} angle (origin is 0,0). The first vector is
 * **mutated**.
 */
export function rotate(point, rad) {
    const { x, y } = point, cos = Math.cos(rad), sin = Math.sin(rad);
    point.x = x * cos - y * sin;
    point.y = x * sin + y * cos;
}
/**
 * Rotates the {@link point} vector around {@link origin} by {@link rad} angle. The first vector is
 * **mutated**.
 *
 * @param point  - The vector to rotate.
 * @param origin - The origin of the rotation.
 * @param rad    - The angle of rotation in radians.
 */
export function rotate_around(point, origin, rad) {
    const { x, y } = point, { x: ox, y: oy } = origin, cos = Math.cos(rad), sin = Math.sin(rad);
    point.x = ox + (x - ox) * cos - (y - oy) * sin;
    point.y = oy + (x - ox) * sin + (y - oy) * cos;
}
/** Represents a force with magnitude and angle in 2D space. */
export class Force {
    /** The magnitude of the force. */
    distance;
    /** The angle of the force in radians. */
    angle;
    constructor(a, b) {
        if (typeof a === "object") {
            this.angle = angle(a, b);
            this.distance = distance(a, b);
        }
        else {
            this.distance = a;
            this.angle = b;
        }
    }
    *[Symbol.iterator]() {
        yield this.distance;
        yield this.angle;
    }
}
/** Creates a new Force instance. */
export const force = (...args) => new Force(...args);
export function force_to_vector(dist, ang) {
    if (typeof dist === "object") {
        ang = dist.angle;
        dist = dist.distance;
    }
    const x = dist * Math.cos(ang);
    const y = dist * Math.sin(ang);
    return vector(x, y);
}
