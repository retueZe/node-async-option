import { Async } from '..'

/** @since v2.0.0 */
export function isPromise(value: unknown): value is Promise<unknown> {
    return (typeof value === 'object' || typeof value === 'function') && value !== null && 'then' in value
}
/** @since v2.0.0 */
export function promisify<T>(async: Async<T>): Promise<T> {
    return isPromise(async)
        ? async
        : Promise.resolve(async)
}
