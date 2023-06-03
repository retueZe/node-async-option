import { NONE, Result, Some } from '..'
import { Async, AsyncOption, ASYNC_NONE, AsyncSome } from '../async'
import { then, isPromise } from '../utils/async'
import { InterruptSignal, LoopResult, normalizeLoopResult, normalizeVoidResult, VoidResult } from './abstraction'
import { ABORT } from './signals'

/** @since v2.5.0 */
export function arrayAsync<T>(
    length: number | null,
    callback: (index: number) => Async<LoopResult<T>>
): AsyncOption<T[]>
/** @since v2.5.0 */
export function arrayAsync<T>(callback: (index: number) => Async<LoopResult<T>>): AsyncOption<T[]>
export function arrayAsync<T>(): AsyncOption<T[]> {
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
        ? ASYNC_NONE
        : new AsyncSome(results.map(result => result.value))

    return new AsyncOption(Promise.all(promises).then(() => isAborted
        ? NONE
        : new Some(results.map(result => result.value))))
}
/** @since v2.5.0 */
export function forEachAsync<T>(
    items: Iterable<T>,
    callback: (item: T, index: number) => Async<VoidResult>
): AsyncOption<number> {
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
        ? ASYNC_NONE
        : new AsyncSome(i)

    return new AsyncOption(Promise.all(promises).then(() => isAborted
        ? NONE
        : new Some(i)))
}
/** @since v2.5.0 */
export function mapAsync<T, U>(
    source: Iterable<T>,
    mapper: (item: T, index: number) => Async<LoopResult<U>>
): AsyncOption<U[]> {
    return new AsyncSome<U[]>([])
        .bind(mappedArray => forEachAsync(source, (item, index): Async<VoidResult> =>
            then(mapper(item, index), mapped => {
                const iterationResult = normalizeLoopResult(mapped)

                if (!iterationResult.isSucceeded) return iterationResult

                mappedArray.push(iterationResult.value)

                return
            })).onSome(iterationCount => mappedArray.length = iterationCount)
            .map(() => mappedArray))
}
