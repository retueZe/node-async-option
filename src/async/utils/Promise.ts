import { Async } from '..'
import { isPromise } from 'node:util/types'

/** @since v2.0.0 */
export function promisify<T>(async: Async<T>): Promise<T> {
    return isPromise(async)
        ? async
        : Promise.resolve(async)
}
