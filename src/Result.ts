import { IResult } from './abstraction'
import { Failure, Success } from './private/sync'

export namespace Result {
    export function success<T>(value: T): IResult<T, never> {
        return new Success(value)
    }
    export function failure<E>(error: E): IResult<never, E> {
        return new Failure(error)
    }
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
}
export type ResultMap<T, E> = {
    readonly [K in keyof T]: IResult<T[K], E>
}
