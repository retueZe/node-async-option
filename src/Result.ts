import { IResult } from './abstraction'
import { Failure, Success } from './private/sync'

/** @since v1.0.0 */
export namespace Result {
    /** @since v1.0.0 */
    export function success<T, E = never>(value: T): IResult<T, E> {
        return new Success(value)
    }
    /** @since v1.0.0 */
    export function failure<E, T = never>(error: E): IResult<T, E> {
        return new Failure(error)
    }
    /** @since v1.0.0 */
    export function extractArray<T, E>(array: readonly IResult<T, E>[], splice?: boolean, defaultItem?: T): IResult<T[], E> {
        splice ??= false
        const extracted: T[] = []

        for (const result of array)
            if (result.isSucceeded)
                extracted.push(result.value)
            else if (splice) {
                if (typeof defaultItem !== 'undefined')
                    extracted.push(defaultItem)
            } else
                return result.cast()

        return success(extracted)
    }
    /** @since v1.0.0 */
    export function extractObject<T, E>(map: ResultMap<T, E>, splice?: boolean): IResult<T, E> {
        splice ??= false
        const extracted = {} as T

        for (const name in map) {
            const result = map[name]

            if (result.isSucceeded)
                extracted[name] = result.value
            else if (!splice)
                return result.cast()
        }

        return success(extracted)
    }
    /** @since v1.9.0 */
    export function handle<T>(factory: () => T): IResult<T, any> {
        let value: T
        
        try { value = factory() } catch (error) { return failure(error) }

        return success(value)
    }
}
/** @since v1.0.0 */
export type ResultMap<T, E> = {
    readonly [K in keyof T]: IResult<T[K], E>
}
