import { Async, callAsync, IAsyncResult, IResult, promisify } from './abstraction'
import { AsyncResultImpl } from './private/async'
import { ASYNC_MONAD_CALLBACKS } from './private/sync'
import { Result } from './Result'

/** @since v0.1.0 */
export namespace AsyncResult {
    function async<T, U, E>(value: Async<T>, callback: (value: T) => IResult<U, E>): IAsyncResult<U, E> {
        return new AsyncResultImpl(promisify(callAsync(value, callback)), ASYNC_MONAD_CALLBACKS)
    }
    /** @since v0.1.0 */
    export function success<T, E = never>(value: Async<T>): IAsyncResult<T, E> {
        return async(value, Result.success)
    }
    /** @since v0.1.0 */
    export function failure<E, T = never>(error: Async<E>): IAsyncResult<T, E> {
        return async(error, Result.failure)
    }
    /** @since v0.1.0 */
    export function extractArray<T, E>(array: readonly Async<IResult<T, E>>[], splice?: boolean, defaultItem?: Async<T>): IAsyncResult<T[], E> {
        splice ??= false
        const extracted = new Array<T | undefined>(array.length)
        let count = 0
        const createCallback = (index: number, resolve: (array: IResult<T[], E>) => void) => (result: IResult<T, E>) => {
            if (!result.isSucceeded && !splice) resolve(result.cast())
            if (splice)
                callAsync(defaultItem, item => extracted[index] = item)
            else
                extracted[index] = result.value

            count++

            if (count + 0.5 > array.length) resolve(Result.success(extracted))
        }
        const promise = new Promise<IResult<T[], E>>(resolve => {
            for (let i = 0; i < array.length; i++)
                callAsync(array[i], createCallback(i, resolve))
        })

        return (success(promise) as IAsyncResult<IResult<T[], E>, E>)
            .bind(result => result)
            .map(array => array.filter(item => typeof item !== 'undefined'))
    }
    /** @since v0.1.0 */
    export function extractObject<T, E>(map: AsyncResultMap<T, E>, splice?: boolean): IAsyncResult<T, E> {
        splice ??= false
        const extracted = {} as T
        const propertyCount = Object.keys(extracted).length
        let count = 0
        const createCallback = (name: string, resolve: (array: IResult<T, E>) => void) => (result: IResult<unknown, E>) => {
            if (!result.isSucceeded && !splice) resolve(result.cast())
            if (!splice) extracted[name] = result.value

            count++

            if (count + 0.5 > propertyCount) resolve(Result.success(extracted))
        }
        const promise = new Promise<IResult<T, E>>(resolve => {
            for (const name in map)
                callAsync(map[name], createCallback(name, resolve))
        })

        return (success(promise) as IAsyncResult<IResult<T, E>, E>)
            .bind(result => result)
    }
}
/** @since v0.1.0 */
export type AsyncResultMap<T, E> = {
    readonly [K in keyof T]: Async<IResult<T, E>>
}
