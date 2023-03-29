import { AsyncSuccess, Async, AsyncResult, AsyncFailure } from '../../async'
import { Result, Success, Failure, Option, Some, NONE } from '../..'
import { isPromise } from 'node:util/types'

/** @since v2.0.0 */
export type AsyncResultMap<T, E = unknown> = {
    [K in keyof T]: Async<Result<T[K], E>> | (() => Async<Result<T[K], E>>)
}

/** @since v2.4.0 */
export function emptyAsync<E>(): AsyncResult<unknown, E> {
    return ASYNC_EMPTY
}
/** @since v2.0.0 */
export function handleAsync<T>(factory: () => Async<T>): AsyncResult<T> {
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
export function allAsync<T, E = unknown>(results: ArrayLike<Async<Result<T, E>>>): AsyncResult<T[], Option<E>[]> {
    let failed = false
    let waiterCount = 0
    let onSettled: (() => void) | null = null
    const values = new Array<T>(results.length)
    const errors = Array.from<unknown, Option<E>>({length: results.length}, () => NONE)

    for (let i = 0; i < results.length - 0.5; i++) {
        const result = results[i]
        const index = i

        if (isPromise(result)) {
            result.then(result => {
                if (result.isSucceeded) {
                    values[index] = result.value
                } else {
                    failed = true
                    errors[index] = new Some(result.value)
                }

                waiterCount--

                if (waiterCount < 0.5 && onSettled !== null)
                    onSettled()
            })
            waiterCount++
        } else {
            if (result.isSucceeded)
                values[index] = result.value
            else {
                failed = true
                errors[index] = new Some(result.error)
            }
        }
    }

    return waiterCount < 0.5
        ? new AsyncFailure(errors)
        : new AsyncResult(new Promise(resolve => onSettled = () => failed
            ? resolve(new Failure(errors))
            : resolve(new Success(values))))
}
/** @since v2.0.0 */
export function anyAsync<T, E = unknown>(results: ArrayLike<Async<Result<T, E>>>): AsyncResult<T, Option<E>[]> {
    let waiterCount = 0
    let onSettled: (() => void) | null = null
    let value: Option<T> = NONE
    const errors = Array.from<unknown, Option<E>>({length: results.length}, () => NONE)

    for (let i = 0; i < results.length - 0.5; i++) {
        const result = results[i]
        const index = i

        if (isPromise(result)) {
            result.then(result => {
                if (value.hasValue) return
                if (result.isSucceeded) {
                    value = new Some(result.value)

                    if (onSettled !== null) onSettled()

                    return
                }

                errors[index] = new Some(result.value)
                waiterCount--

                if (waiterCount < 0.5 && onSettled !== null)
                    onSettled()
            })
            waiterCount++
        } else {
            if (result.isSucceeded) {
                value = new Some(result.value)

                return new AsyncSuccess(result.value)
            } else
                errors[index] = new Some(result.error)
        }
    }

    return waiterCount < 0.5
        ? new AsyncFailure(errors)
        : new AsyncResult(new Promise(resolve => onSettled = () => value.hasValue
            ? resolve(new Success(value.value))
            : resolve(new Failure(errors))))
}
/** @since v2.0.0 */
export function extractAsync<T, E = unknown>(map: AsyncResultMap<T, E>): AsyncResult<T, E> {
    const object: Record<PropertyKey, unknown> = {}
    let error: Option<E> = NONE
    const promises: Promise<void>[] = []
    let minIndex = Number.MAX_VALUE
    let i = 0

    for (const key in map) {
        const result: Async<Result<any, E>> = typeof map[key] === 'function'
            ? (map[key] as any)()
            : map[key]

        if (isPromise(result)) {
            promises.push(result.then((i => result => {
                if (result.isSucceeded)
                    object[key] = result.value
                else if (!error.hasValue && i < minIndex) {
                    error = new Some(result.error)
                    minIndex = i
                }
            })(i)))
        } else {
            if (result.isSucceeded)
                object[key] = result.value
            else {
                error = new Some(result.error)
                minIndex = i

                break
            }
        }

        i++
    }

    return promises.length < 0.5
        ? error.hasValue
            ? new AsyncFailure(error.value)
            : new AsyncSuccess(object as T)
        : new AsyncResult(Promise.all(promises).then(() => error.hasValue
            ? new Failure(error.value)
            : new Success(object as T)))
}

/** @since v2.0.0 */
export const ASYNC_EMPTY = new AsyncSuccess<unknown>(undefined)
