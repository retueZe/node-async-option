import { Async } from '..'
import { isPromise } from './Promise'

/** @since v2.0.0 */
export type AsyncMapper<T, U> = (value: T) => Async<U>

/** @since v2.0.0 */
export function then<T, U>(
    value: Async<T>,
    callback: AsyncMapper<T, U>
): Async<U>
/** @since v2.0.0 */
export function then<T, U1, U2>(
    value: Async<T>,
    callback1: AsyncMapper<T, U1>,
    callback2: AsyncMapper<U1, U2>
): Async<U2>
/** @since v2.0.0 */
export function then<T, U1, U2, U3>(
    value: Async<T>,
    callback1: AsyncMapper<T, U1>,
    callback2: AsyncMapper<U1, U2>,
    callback3: AsyncMapper<U2, U3>
): Async<U3>
/** @since v2.0.0 */
export function then<T, U1, U2, U3, U4>(
    value: Async<T>,
    callback1: AsyncMapper<T, U1>,
    callback2: AsyncMapper<U1, U2>,
    callback3: AsyncMapper<U2, U3>,
    callback4: AsyncMapper<U3, U4>
): Async<U4>
/** @since v2.0.0 */
export function then<T>(
    value: Async<T>,
    callback: AsyncMapper<T, unknown>,
    ...rest: AsyncMapper<unknown, unknown>[]
): Async<unknown>
export function then<T>(
    value: Async<T>,
    callback: AsyncMapper<T, unknown>,
    ...rest: AsyncMapper<unknown, unknown>[]
): Async<unknown> {
    if (rest.length < 0.5) return isPromise(value)
        ? value.then(callback)
        : callback(value)

    return rest.reduceRight((y, f) => isPromise(y)
        ? y.then(y => f(y))
        : f(y), isPromise(value)
        ? value.then(callback)
        : callback(value))
}
