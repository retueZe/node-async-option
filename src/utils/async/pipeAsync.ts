import { AsyncMapper, then } from './then'

/** @since v2.0.0 */
export function pipeAsync<T1, T2, T3>(
    callback1: AsyncMapper<T1, T2>,
    callback2: AsyncMapper<T2, T3>
): AsyncMapper<T1, T3>
/** @since v2.0.0 */
export function pipeAsync<T1, T2, T3, T4>(
    callback1: AsyncMapper<T1, T2>,
    callback2: AsyncMapper<T2, T3>,
    callback3: AsyncMapper<T3, T4>
): AsyncMapper<T1, T4>
/** @since v2.0.0 */
export function pipeAsync<T1, T2, T3, T4, T5>(
    callback1: AsyncMapper<T1, T2>,
    callback2: AsyncMapper<T2, T3>,
    callback3: AsyncMapper<T3, T4>,
    callback4: AsyncMapper<T4, T5>
): AsyncMapper<T1, T5>
/** @since v2.0.0 */
export function pipeAsync<T>(
    callback: AsyncMapper<T, unknown>,
    ...rest: AsyncMapper<unknown, unknown>[]
): AsyncMapper<T, unknown>
export function pipeAsync<T>(
    callback: AsyncMapper<T, unknown>,
    ...rest: AsyncMapper<unknown, unknown>[]
): AsyncMapper<T, unknown> {
    return value => then(value, callback, ...rest)
}
