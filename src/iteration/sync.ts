import { Failure, Result, Success } from '..'
import { LoopResult, normalizeLoopResult, normalizeVoidResult, VoidResult } from './abstraction'

/** @since v2.0.0 */
export function array<T>(length: number | null, callback: (index: number) => LoopResult<T>): Result<T[], number>
/** @since v2.0.0 */
export function array<T>(callback: (index: number) => LoopResult<T>): Result<T[], number>
export function array<T>(): Result<T[], number> {
    const length: number | null = typeof arguments[0] === 'number' || arguments[0] === null
        ? arguments[0]
        : null
    const callback: (index: number) => LoopResult<T> = typeof arguments[1] === 'undefined'
        ? arguments[0]
        : arguments[1]
    const array = length === null ? [] : new Array<T>(length)
    let isAborted = false

    for (let i = 0; length === null || i < length; i++) {
        const result = normalizeLoopResult(callback(i))

        if (!result.isSucceeded) {
            isAborted = result.error === 'abort'

            if (length !== null) array.length = i

            break
        }
        if (length === null)
            array.push(result.value)
        else
            array[i] = result.value
    }

    return isAborted ? new Failure(array.length) : new Success(array)
}
/** @since v2.0.0 */
export function forEach<T>(
    items: Iterable<T>,
    callback: (item: T, index: number) => VoidResult
): Result<number, number> {
    let index = 0
    let isAborted = false

    for (const item of items) {
        const result = normalizeVoidResult(callback(item, index++))

        if (result !== 'continue') {
            isAborted = result === 'abort'

            break
        }
    }

    return isAborted ? new Failure(index) : new Success(index)
}
/** @since v2.0.0 */
export function map<T, U>(
    source: Iterable<T>,
    mapper: (item: T, index: number) => LoopResult<U>
): Result<U[], number> {
    return new Success<U[]>([])
        .bind(mapped => forEach(source, (item, index): VoidResult => {
            const iterationResult = normalizeLoopResult(mapper(item, index))

            if (!iterationResult.isSucceeded) return iterationResult

            mapped.push(iterationResult.value)
        }).map(() => mapped))
}
