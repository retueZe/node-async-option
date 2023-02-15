import { AsyncSuccess, Async, AsyncResult, AsyncFailure } from '../..'
import { Result, Success, Failure } from '../../..'
import { isPromise, promisify } from '..'
import { all as allSync, ErrorMap } from '../../../utils/result'

/** @since v2.0.0 */
export type AsyncResultMap<T, E = unknown> = {
    [K in keyof T]: Async<Result<T[K], E>> | (() => Async<Result<T[K], E>>)
}

/** @since v2.0.0 */
export function handle<T>(factory: () => Async<T>): AsyncResult<T> {
    let factoryResult: Async<T>

    try {
        factoryResult = factory()
    } catch (error) {
        return new AsyncFailure(error)
    }

    if (!isPromise(factoryResult)) return new AsyncSuccess(factoryResult)

    return new AsyncResult(factoryResult
        .then(value => new Success(value), error => new Failure(error)))
}
/** @since v2.0.0 */
export function all<T, E = unknown>(results: Iterable<Async<Result<T, E>>>): AsyncResult<T[], E[]> {
    const promises: Promise<Result<T, E>>[] = []

    for (const result of results)
        promises.push(promisify(result))

    return new AsyncResult(Promise.all(promises).then(allSync))
}
/** @since v2.0.0 */
export function any<T, E = unknown>(_results: Iterable<Async<Result<T, E>>>): AsyncResult<T, E[]> {
    const results: readonly Async<Result<T, E>>[] = Array.isArray(_results) ? _results : [..._results]
    let resultReceived = false
    let waiterCount = 0
    let resultReceiver: ((option: Result<T, E[]>) => void) | null = null
    const errors = new Array<E>(results.length)
    let i = 0

    for (const result of results) {
        const index = i++

        if (isPromise(result)) {
            result.then(result => {
                if (resultReceived) return
                if (result.isSucceeded) {
                    resultReceived = true

                    if (resultReceiver !== null) resultReceiver(result)
                }

                waiterCount--
                errors[index] = result.error

                if (waiterCount < 0.5 && resultReceiver !== null)
                    resultReceiver(new Failure(errors))
            })
            waiterCount++
        } else {
            if (result.isSucceeded) {
                resultReceived = true

                return result.toAsync()
            } else
                errors[index] = result.error
        }
    }

    return waiterCount < 0.5
        ? new AsyncFailure(errors)
        : new AsyncResult(new Promise(resolve => resultReceiver = resolve))
}
/** @since v2.0.0 */
export function extract<T, E = unknown>(map: AsyncResultMap<T, E>): AsyncResult<T, ErrorMap<T, E>> {
    let failed = false
    const object: Record<PropertyKey, unknown> = {}
    const errors: Record<PropertyKey, E> = {}
    const promises: Promise<void>[] = []

    for (const key in map) {
        const result: Async<Result<any, E>> = typeof map[key] === 'function'
            ? (map[key] as any)()
            : map[key]

        if (isPromise(result)) {
            promises.push(result.then(result => {
                if (result.isSucceeded)
                    object[key] = result.value
                else {
                    failed = true
                    errors[key] = result.error
                }
            }))
        } else {
            if (result.isSucceeded)
                object[key] = result.value
            else {
                failed = true
                errors[key] = result.error
            }
        }
    }

    return promises.length < 0.5
        ? failed
            ? new AsyncFailure(errors)
            : new AsyncSuccess(object as T)
        : new AsyncResult(Promise.all(promises).then(() => failed
            ? new Failure(errors)
            : new Success(object as T)))
}

/** @since v2.0.0 */
export const EMPTY = new AsyncSuccess<unknown>(undefined)
