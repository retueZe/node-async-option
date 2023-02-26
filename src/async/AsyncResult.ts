import { Option, ValueNotProvidedError, Success, Failure, Result, ResultLike } from '..'
import { Async, AsyncOption } from './AsyncOption'
import { pipeAsync, promisify, then } from '../utils/async'
import { isPromise } from 'node:util/types'

/** @since v2.0.0 */
export interface AsyncResult<T, E = unknown> extends Promise<Result<T, E>> {
    /** @since v2.0.0 */
    readonly value: Promise<T>
    /** @since v2.0.0 */
    readonly error: Promise<E>
    /** @since v2.0.0 */
    readonly isSucceeded: Promise<boolean>
    /** @since v2.0.0 */
    readonly measured: Promise<T | E>

    /** @since v2.0.0 */
    onSuccess(callback: (value: T) => Async<unknown>): AsyncResult<T, E>
    /** @since v2.0.0 */
    onFailure(callback: (error: E) => Async<unknown>): AsyncResult<T, E>
    /** @since v2.0.0 */
    onBoth(callback: (measured: T | E) => Async<unknown>): AsyncResult<T, E>
    /** @since v2.0.0 */
    swap(): AsyncResult<E, T>
    /** @since v2.0.0 */
    bind<U>(binder: (value: T) => Async<Result<U, E>>): AsyncResult<U, E>
    /** @since v2.0.0 */
    bindError<U>(binder: (error: E) => Async<Result<T, U>>): AsyncResult<T, U>
    /** @since v2.0.0 */
    map<U>(mapper: (value: T) => Async<U>): AsyncResult<U, E>
    /** @since v2.0.0 */
    mapError<U>(mapper: (error: E) => Async<U>): AsyncResult<T, U>
    /** @since v2.0.0 */
    or<T1, E1>(factory: (error: E) => Async<Result<T1, E1>>): AsyncResult<T | T1, E | E1>
    /** @since v2.0.0 */
    elseIf<U>(condition: AsyncFailureElseIfCondition<E>, factory: (error: E) => Async<U>): AsyncResult<T | U, E>
    /** @since v2.0.0 */
    else<U>(factory: (error: E) => Async<U>): AsyncResult<T | U, never>
    /** @since v2.0.0 */
    filter(condition: (value: T) => Async<Option<E>>): AsyncResult<T, E>
    /** @since v2.0.0 */
    filterError(condition: (error: E) => Async<Option<T>>): AsyncResult<T, E>
    /** @since v2.0.0 */
    get(errorFactory: (error: E) => Async<Error>): Promise<T>
    /** @since v2.0.0 */
    getError(errorFactory: (value: T) => Async<Error>): Promise<E>
    /** @since v2.0.0 */
    toOption(): AsyncOption<T>
}
type AsyncErrorPredicate<E = unknown> = (error: E) => Async<boolean>
/** @since v2.0.0 */
export type AsyncFailureElseIfCondition<E = unknown> = AsyncErrorPredicate<E> | Iterable<AsyncErrorPredicate<E>>
/** @since v2.0.0 */
export const AsyncResult: AsyncResultConstructor = class AsyncResult<T, E> implements AsyncResultInterface<T, E> {
    private readonly _result: Promise<Result<T, E>>
    private _value: Promise<T> | null = null
    private _error: Promise<E> | null = null
    private _isSucceeded: Promise<boolean> | null = null
    private _measured: Promise<T | E> | null = null
    get value(): Promise<T> {
        return this._value ??= this._result.then(result => result.isSucceeded
            ? result.value
            : Promise.reject(new ValueNotProvidedError()))
    }
    get error(): Promise<E> {
        return this._error ??= this._result.then(result => result.isSucceeded
            ? Promise.reject(new ValueNotProvidedError())
            : result.error)
    }
    get isSucceeded(): Promise<boolean> {
        return this._isSucceeded ??= this._result.then(result => result.isSucceeded)
    }
    get measured(): Promise<T | E> {
        return this._measured ??= this._result.then(result => result.measured)
    }
    get [Symbol.toStringTag](): string {
        return AsyncResult.name
    }

    constructor(result: Async<Result<T, E>>) {
        this._result = promisify(result)
    }

    private _then<T1, E1>(callback: (result: Result<T, E>) => Async<Result<T1, E1>>): AsyncResult<T1, E1> {
        return new AsyncResult(this.then(callback))
    }
    onSuccess(callback: (value: T) => Async<unknown>): AsyncResult<T, E> {
        return this._then(result => result.onSuccess(callback))
    }
    onFailure(callback: (error: E) => Async<unknown>): AsyncResult<T, E> {
        return this._then(result => result.onFailure(callback))
    }
    onBoth(callback: (measured: T | E) => Async<unknown>): AsyncResult<T, E> {
        return this._then(result => result.onBoth(callback))
    }
    swap(): AsyncResult<E, T> {
        return this._then(result => result.swap())
    }
    bind<U>(binder: (value: T) => Async<Result<U, E>>): AsyncResult<U, E> {
        return this._then(result => result.isSucceeded
            ? binder(result.value)
            : result)
    }
    bindError<U>(binder: (error: E) => Async<Result<T, U>>): AsyncResult<T, U> {
        return this._then(result => result.isSucceeded
            ? result
            : binder(result.error))
    }
    map<U>(mapper: (value: T) => Async<U>): AsyncResult<U, E> {
        return this.bind(pipeAsync(mapper, mapped => new Success(mapped)))
    }
    mapError<U>(mapper: (error: E) => Async<U>): AsyncResult<T, U> {
        return this.bindError(pipeAsync(mapper, mapped => new Failure(mapped)))
    }
    or<T1, E1>(factory: (error: E) => Async<Result<T1, E1>>): AsyncResult<T | T1, E | E1> {
        return this._then<T | T1, E | E1>(result => result.isSucceeded
            ? result
            : factory(result.error))
    }
    elseIf<U>(condition: AsyncFailureElseIfCondition<E>, factory: (error: E) => Async<U>): AsyncResult<T | U, E> {
        return this._then(result => {
            if (result.isSucceeded) return result

            const subconditionResults: Promise<boolean>[] = []

            if (typeof condition === 'function') {
                const conditionResult = condition(result.error)

                if (isPromise(conditionResult))
                    subconditionResults.push(conditionResult)
                else
                    return conditionResult
                        ? then(factory(result.error), value => new Success(value))
                        : result
            } else {
                for (const subcondition of condition) {
                    const subconditionResult = subcondition(result.error)

                    if (isPromise(subconditionResult))
                        subconditionResults.push(subconditionResult)
                    else if (!subconditionResult)
                        return result
                }
            }
            if (subconditionResults.length < 0.5)
                return then(factory(result.error), value => new Success(value))

            const conditionPromise = subconditionResults.length < 1.5
                ? subconditionResults[0]
                : Promise.all(subconditionResults).then(results => results.every(_ => _))

            return conditionPromise
                .then(conditionResult => conditionResult
                    ? then(factory(result.error), value => new Success(value))
                    : result)
        })
    }
    else<U>(factory: (error: E) => Async<U>): AsyncResult<T | U, never> {
        return this._then<T | U, never>(result => result.isSucceeded
            ? result
            : then(factory(result.error), value => new Success(value)))
    }
    filter(condition: (value: T) => Async<Option<E>>): AsyncResult<T, E> {
        return this._then(result => result.isSucceeded
            ? then(condition(result.value), conditionResult => conditionResult.hasValue
                ? new Failure(conditionResult.value)
                : result)
            : result)
    }
    filterError(condition: (error: E) => Async<Option<T>>): AsyncResult<T, E> {
        return this._then(result => result.isSucceeded
            ? result
            : then(condition(result.error), conditionResult => conditionResult.hasValue
                ? new Success(conditionResult.value)
                : result))
    }
    get(errorFactory: (error: E) => Async<Error>): Promise<T> {
        return this.then(result => result.isSucceeded
            ? result.value
            : then(errorFactory(result.error), error => Promise.reject(error)))
    }
    getError(errorFactory: (value: T) => Async<Error>): Promise<E> {
        return this.then(result => result.isSucceeded
            ? then(errorFactory(result.value), error => Promise.reject(error))
            : result.error)
    }
    toOption(): AsyncOption<T> {
        return new AsyncOption(this.then(result => result.toOption()))
    }
    then<F = Result<T, E>, R = never>(onResolved?: ((value: Result<T, E>) => F | PromiseLike<F>) | null | undefined, onRejected?: ((reason: any) => R | PromiseLike<R>) | null | undefined): Promise<F | R> {
        return this._result.then(onResolved, onRejected)
    }
    catch<R = never>(onRejected?: ((reason: any) => R | PromiseLike<R>) | null | undefined): Promise<Result<T, E> | R> {
        return this._result.catch(onRejected)
    }
    finally(callback?: (() => void) | null | undefined): Promise<Result<T, E>> {
        return this._result.finally(callback)
    }
}
interface AsyncResultConstructor {
    readonly prototype: AsyncResult<any, any>

    new<T, E = unknown>(result: Async<Result<T, E>>): AsyncResult<T, E>
}
type AsyncResultInterface<T, E = unknown> = AsyncResult<T, E>
/** @since v2.0.0 */
export type AsyncResultLike<T, E = unknown> = PromiseLike<ResultLike<T, E>>
