import { Result, Success, Failure } from '../..'

/** @since v2.0.0 */
export type ResultMap<T, E = unknown> = {
    [K in keyof T]: Result<T[K], E> | (() => Result<T[K], E>)
}
/** @since v2.0.0 */
export type ErrorMap<T, E = unknown> = {
    [K in keyof T]?: E
}

/** @since v2.0.0 */
export function handle<T>(factory: () => T): Result<T> {
    try {
        return new Success(factory())
    } catch (error) {
        return new Failure(error)
    }
}
/** @since v2.0.0 */
export function all<T, E = unknown>(results: Iterable<Result<T, E>>): Result<T[], E[]> {
    const values: T[] = []
    const errors: E[] = []

    for (const result of results)
        if (result.isSucceeded)
            values.push(result.value)
        else
            errors.push(result.error)

    return errors.length > 0.5
        ? new Failure(errors)
        : new Success(values)
}
/** @since v2.0.0 */
export function any<T, E = unknown>(results: Iterable<Result<T, E>>): Result<T, E[]> {
    const errors: E[] = []

    for (const result of results)
        if (result.isSucceeded)
            return new Success(result.value)
        else
            errors.push(result.error)

    return new Failure(errors)
}
/** @since v2.0.0 */
export function extract<T, E = unknown>(map: ResultMap<T, E>): Result<T, ErrorMap<T, E>> {
    const object: Record<PropertyKey, unknown> = {}
    const errors: Record<PropertyKey, E> = {}
    let failed = false

    for (const key in map) {
        const result: Result<any, E> = typeof map[key] === 'function'
            ? (map[key] as any)()
            : map[key]

        if (result.isSucceeded)
            object[key] = result.value
        else {
            errors[key] = result.error
            failed = true
        }
    }

    return failed
        ? new Failure(errors)
        : new Success(object as T)
}

/** @since v2.0.0 */
export const EMPTY = new Success<unknown>(undefined)
