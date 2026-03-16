/**
 * No easing, no acceleration
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function linear(t: number): number;
/**
 * Slight acceleration from zero to full speed
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_sine(t: number): number;
/**
 * Slight deceleration at the end
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function out_sine(t: number): number;
/**
 * Slight acceleration at beginning and slight deceleration at end
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_out_sine(t: number): number;
/**
 * Accelerating from zero velocity
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_quad(t: number): number;
/**
 * Decelerating to zero velocity
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function out_quad(t: number): number;
/**
 * Acceleration until halfway, then deceleration
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_out_quad(t: number): number;
/**
 * Accelerating from zero velocity
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_cubic(t: number): number;
/**
 * Decelerating to zero velocity
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function out_cubic(t: number): number;
/**
 * Acceleration until halfway, then deceleration
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_out_cubic(t: number): number;
/**
 * Accelerating from zero velocity
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_quart(t: number): number;
/**
 * Decelerating to zero velocity
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function out_quart(t: number): number;
/**
 * Acceleration until halfway, then deceleration
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_out_quart(t: number): number;
/**
 * Accelerating from zero velocity
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_quint(t: number): number;
/**
 * Decelerating to zero velocity
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function out_quint(t: number): number;
/**
 * Acceleration until halfway, then deceleration
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_out_quint(t: number): number;
/**
 * Accelerate exponentially until finish
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_expo(t: number): number;
/**
 * Initial exponential acceleration slowing to stop
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function out_expo(t: number): number;
/**
 * Exponential acceleration and deceleration
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_out_expo(t: number): number;
/**
 * Increasing velocity until stop
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_circ(t: number): number;
/**
 * Start fast, decreasing velocity until stop
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function out_circ(t: number): number;
/**
 * Fast increase in velocity, fast decrease in velocity
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_out_circ(t: number): number;
/**
 * Slow movement backwards then fast snap to finish
 *
 * @param   t         - The current time (between 0 and 1)
 * @param   magnitude - The magnitude of the easing (default: 1.70158)
 * @returns           The eased value
 */
export declare function in_back(t: number, magnitude?: number): number;
/**
 * Fast snap to backwards point then slow resolve to finish
 *
 * @param   t         - The current time (between 0 and 1)
 * @param   magnitude - The magnitude of the easing (default: 1.70158)
 * @returns           The eased value
 */
export declare function out_back(t: number, magnitude?: number): number;
/**
 * Slow movement backwards, fast snap to past finish, slow resolve to finish
 *
 * @param   t         - The current time (between 0 and 1)
 * @param   magnitude - The magnitude of the easing (default: 1.70158)
 * @returns           The eased value
 */
export declare function in_out_back(t: number, magnitude?: number): number;
/**
 * Bounces slowly then quickly to finish
 *
 * @param   t         - The current time (between 0 and 1)
 * @param   magnitude - The magnitude of the easing (default: 0.7)
 * @returns           The eased value
 */
export declare function in_elastic(t: number, magnitude?: number): number;
/**
 * Fast acceleration, bounces to zero
 *
 * @param   t         - The current time (between 0 and 1)
 * @param   magnitude - The magnitude of the easing (default: 0.7)
 * @returns           The eased value
 */
export declare function out_elastic(t: number, magnitude?: number): number;
/**
 * Slow start and end, two bounces sandwich a fast motion
 *
 * @param   t         - The current time (between 0 and 1)
 * @param   magnitude - The magnitude of the easing (default: 0.7)
 * @returns           The eased value
 */
export declare function in_out_elastic(t: number, magnitude?: number): number;
/**
 * Bounce to completion
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function out_bounce(t: number): number;
/**
 * Bounce increasing in velocity until completion
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_bounce(t: number): number;
/**
 * Bounce in and bounce out
 *
 * @param   t - The current time (between 0 and 1)
 * @returns   The eased value
 */
export declare function in_out_bounce(t: number): number;
//# sourceMappingURL=ease.d.ts.map