import type { Position } from "./types.js";
/**
 * Represents a template string type in the format `(${number}, ${number})`.
 *
 * Useful for storing in a Set or Map to check if a point exists.
 */
export type Vector_String = `(${number}, ${number})`;
/** Represents a 2D vector with x and y components. */
export declare class Vector {
    x: number;
    y: number;
    /**
     * Creates a new vector instance.
     *
     * @param str - A string in the format `(${number}, ${number})`.
     *
     *   OR
     * @param vec - A Point object to copy the x and y components from.
     *
     *   OR
     * @param x   - The x-component of the vector.
     * @param y   - The y-component of the vector.
     */
    constructor(str: Vector_String);
    constructor(vec: Position);
    constructor(x: number, y?: number);
    [Symbol.iterator](): Generator<number>;
    toString(): Vector_String;
    toJSON(): Position;
}
/** Creates a new vector instance. */
export declare const vector: {
    (str: Vector_String): Vector;
    (vector: Position): Vector;
    (x: number, y?: number): Vector;
};
/** A constant vector representing the zero vector. */
export declare const ZERO: Vector;
/**
 * Creates a new vector instance representing the zero vector.
 *
 * @returns A vector instance representing the zero vector.
 */
export declare function zero(): Vector;
/** Checks if two vectors are equal. */
export declare function equals(a: Position, b: Position): boolean;
export declare function normalize(p: Position): void;
/** Subtracts a vector from another vector in place. The first vector is **mutated**. */
export declare function subtract(a: Position, b: Position): void;
/**
 * Calculates the difference between two vectors.
 *
 * @returns The difference vector.
 */
export declare function difference(a: Position, b: Position): Vector;
/** Adds a vector or a force to another vector in place. The first vector is **mutated**. */
export declare function add(vec: Position, velocity: Position | Force | number): void;
export declare function add(vec: Position, x: number, y: number): void;
/**
 * Calculates the sum of two vectors.
 *
 * @returns The sum vector.
 */
export declare function sum(a: Position, b: Position): Vector;
/** Multiplies a vector by another vector or a scalar in place. The first vector is **mutated**. */
export declare function multiply(a: Position, b: Position | number): void;
/**
 * Calculates the product of two vectors.
 *
 * @returns The product vector.
 */
export declare function product(a: Position, b: Position | number): Vector;
/** Divides a vector by another vector in place. The first vector is **mutated**. */
export declare function divide(a: Position, b: Position): void;
/**
 * Calculates the quotient of two vectors. (The first vector is divided by the second vector.)
 *
 * @returns The quotient vector.
 */
export declare function quotient(a: Position, b: Position): Vector;
export declare function map(vec: Position, fn: (xy: number) => number): Vector;
export declare function mut(vec: Position, fn: (xy: number) => number): void;
/**
 Calculates the distance between two vectors.

 @returns The distance between the vectors.
*/
export declare function distance(a: Position, b: Position): number;
export declare function distance_xy(ax: number, ay: number, bx: number, by: number): number;
export declare function average(...vectors: Position[]): Vector;
/**
 * Calculates the angle between two vectors.
 *
 * @returns The angle between the vectors in radians.
 */
export declare function angle(a: Position, b: Position): number;
/**
 * Rotates the {@link point} vector by {@link rad} angle (origin is 0,0). The first vector is
 * **mutated**.
 */
export declare function rotate(point: Vector, rad: number): void;
/**
 * Rotates the {@link point} vector around {@link origin} by {@link rad} angle. The first vector is
 * **mutated**.
 *
 * @param point  - The vector to rotate.
 * @param origin - The origin of the rotation.
 * @param rad    - The angle of rotation in radians.
 */
export declare function rotate_around(point: Vector, origin: Vector, rad: number): void;
/** Represents a force with magnitude and angle in 2D space. */
export declare class Force {
    /** The magnitude of the force. */
    distance: number;
    /** The angle of the force in radians. */
    angle: number;
    /**
     * Creates a new Force instance.
     *
     * @param delta_x  - The x-component of the vector representing the force.
     * @param delta_y  - The y-component of the vector representing the force.
     *
     *   OR
     * @param distance - The magnitude of the force.
     * @param angle    - The angle of the force in radians.
     */
    constructor(delta_x: Vector, delta_y: Vector);
    constructor(dist: number, ang: number);
    [Symbol.iterator](): Generator<number>;
}
/** Creates a new Force instance. */
export declare const force: {
    (a: Vector, b: Vector): Force;
    (distance: number, angle: number): Force;
};
/** Converts a Force object to a vector object with x and y components. */
export declare function force_to_vector(f: Force): Vector;
export declare function force_to_vector(dist: number, ang: number): Vector;
/** Represents a line segment with two endpoints. */
export type Segment = [Vector, Vector];
//# sourceMappingURL=trig.d.ts.map