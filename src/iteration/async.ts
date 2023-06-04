import { Failure, Result, Success } from '..'
import { Async, AsyncResult, AsyncSuccess } from '../async'
import { then, isPromise } from '../utils/async'
import { LoopResult, normalizeLoopResult, normalizeVoidResult, VoidResult } from './abstraction'

/** @since v2.5.0 */
export function arrayAsync<T>(
    length: number | null,
    callback: (index: number) => Async<LoopResult<T>>
): AsyncResult<T[], number>
/**
 * @see {@link arrayAsync}
 * @since v2.5.0
 */
export function arrayAsync<T>(callback: (index: number) => Async<LoopResult<T>>): AsyncResult<T[], number>
export function arrayAsync<T>(): AsyncResult<T[], number> {
    return new AsyncResult(arrayAsyncImpl(arguments))
}
/** @since v2.5.0 */
export function forEachAsync<T>(
    items: AsyncIterable<T>,
    callback: (item: T, index: number) => Async<VoidResult>
): AsyncResult<number, number> {
    return new AsyncResult(forEachAsyncImpl(items, callback))
}
/** @since v2.5.0 */
export function mapAsync<T, U>(
    source: AsyncIterable<T>,
    mapper: (item: T, index: number) => Async<LoopResult<U>>
): AsyncResult<U[], number> {
    return new AsyncSuccess<U[], number>([])
        .bind(mappedArray => forEachAsync(source, (item, index): Async<VoidResult> =>
            then(mapper(item, index), mapped => {
                const iterationResult = normalizeLoopResult(mapped)

                if (!iterationResult.isSucceeded) return iterationResult

                mappedArray.push(iterationResult.value)

                return
            })).onSuccess(iterationCount => mappedArray.length = iterationCount)
            .map(() => mappedArray))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function arrayAsyncImpl<T>(...args: any): Promise<Result<T[], number>> {
    const length: number | null = typeof arguments[0] === 'number' || arguments[0] === null
        ? arguments[0]
        : null
    const callback: (index: number) => Async<LoopResult<T>> = typeof arguments[1] === 'undefined'
        ? arguments[0]
        : arguments[1]
    const array = length === null ? [] : new Array<T>(length)

    for (let i = 0; length === null || i < length; i++) {
        const result = callback(i)
        const item = normalizeLoopResult(isPromise(result) ? await result : result)

        if (!item.isSucceeded) {
            if (item.error === 'abort') return new Failure(i)
            if (length !== null) array.length = i

            break
        }
        if (length === null)
            array.push(item.value)
        else
            array[i] = item.value
    }

    return new Success(array)
}
async function forEachAsyncImpl<T>(
    items: AsyncIterable<T>,
    callback: (item: T, index: number) => Async<VoidResult>
): Promise<Result<number, number>> {
    let i = 0

    for await (const item of items) {
        const callbackResult = callback(item, i)
        const result = normalizeVoidResult(isPromise(callbackResult) ? await callbackResult : callbackResult)

        if (result !== 'continue') {
            if (result === 'abort') return new Failure(i)

            break
        }

        i++
    }

    return new Success(i)
}
