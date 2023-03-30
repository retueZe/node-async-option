import { Async } from '../../async'

/** @since v2.0.0 */
export function promisify<T>(async: Async<T>): Promise<T> {
    return isPromise(async)
        ? async
        : Promise.resolve(async)
}
/** @since v2.5.0 */
export function isPromise(value: unknown): value is Promise<unknown> {
    return typeof value === 'object' && value !== null && 'then' in value
}
