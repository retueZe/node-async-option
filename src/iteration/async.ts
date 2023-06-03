import { Failure, Result, Success } from '..'
import { Async, AsyncFailure, AsyncResult, AsyncSuccess } from '../async'
import { then, isPromise } from '../utils/async'
import { InterruptSignal, LoopResult, normalizeLoopResult, normalizeVoidResult, VoidResult } from './abstraction'
import { ABORT } from './signals'

/** @since v2.5.0 */
export function arrayAsync<T>(
    length: number | null,
    callback: (index: number) => Async<LoopResult<T>>
): AsyncResult<T[], number>
/** @since v2.5.0 */
export function arrayAsync<T>(callback: (index: number) => Async<LoopResult<T>>): AsyncResult<T[], number>
export function arrayAsync<T>(): AsyncResult<T[], number> {
    const length: number | null = typeof arguments[0] === 'number' || arguments[0] === null
        ? arguments[0]
        : null
    const callback: (index: number) => Async<LoopResult<T>> = typeof arguments[1] === 'undefined'
        ? arguments[0]
        : arguments[1]
    const results = length === null ? [] : new Array<Result<T, InterruptSignal>>(length)
    const promises: Promise<void>[] = []
    let isAborted = false

    for (let i = 0; length === null || i < length; i++) {
        const result = callback(i)
        let toPush: Result<T, InterruptSignal>

        if (isPromise(result)) {
            toPush = ABORT
            promises.push(result.then((function(index: number, result: LoopResult<T>): void {
                if (results.length - 0.5 < index) return

                const normalized = normalizeLoopResult(result)

                if (!normalized.isSucceeded) {
                    isAborted = normalized.error === 'abort'

                    results.length = index

                    return
                }

                results[index] = normalized
            }).bind(undefined, i)))
        } else {
            const normalized = normalizeLoopResult(result)

            if (!normalized.isSucceeded) {
                isAborted = normalized.error === 'abort'

                if (length !== null) results.length = i

                break
            }

            toPush = normalized
        }
        if (length === null)
            results.push(toPush)
        else
            results[i] = toPush
    }

    if (promises.length < 0.5) return isAborted
        ? new AsyncFailure(results.length)
        : new AsyncSuccess(results.map(result => result.value))

    return new AsyncResult(Promise.all(promises).then(() => isAborted
        ? new Failure(results.length)
        : new Success(results.map(result => result.value))))
}
/** @since v2.5.0 */
export function forEachAsync<T>(
    items: Iterable<T>,
    callback: (item: T, index: number) => Async<VoidResult>
): AsyncResult<number, number> {
    const iterator = items[Symbol.iterator]()
    let i = 0
    const promises: Promise<void>[] = []
    let isAborted = false

    for (;; i++) {
        const iteratorResult = iterator.next()

        if (iteratorResult.done ?? false) break

        const result = callback(iteratorResult.value, i)

        if (isPromise(result)) {
            promises.push(result.then((function(index: number, result: VoidResult): void {
                if (i - 0.5 < index) return

                const normalized = normalizeVoidResult(result)

                if (normalized !== 'continue') {
                    isAborted = normalized === 'abort'

                    i = index

                    return
                }
            }).bind(undefined, i)))
        } else {
            const normalized = normalizeVoidResult(result)

            if (normalized !== 'continue') {
                isAborted = normalized === 'abort'

                break
            }
        }
    }

    if (promises.length < 0.5) return isAborted
        ? new AsyncFailure(i)
        : new AsyncSuccess(i)

    return new AsyncResult(Promise.all(promises).then(() => isAborted
        ? new Failure(i)
        : new Success(i)))
}
/** @since v2.5.0 */
export function mapAsync<T, U>(
    source: Iterable<T>,
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
