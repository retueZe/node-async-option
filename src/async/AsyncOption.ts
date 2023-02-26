import { isPromise } from 'node:util/types'
import { Option, OptionLike, Some, ValueNotProvidedError, Success, Failure } from '..'
//! importing separately because of circular dependency and the dependency is used at the top-level of the file
import { NONE } from '../None'
import { AsyncResult } from './AsyncResult'
import { pipeAsync, promisify, then } from './utils'

/** @since v2.0.0 */
export interface AsyncOption<T> extends Promise<Option<T>> {
    /** @since v2.0.0 */
    readonly value: Promise<T>
    /** @since v2.0.0 */
    readonly hasValue: Promise<boolean>
    /** @since v2.0.0 */
    readonly measured: Promise<T | undefined>

    /** @since v2.0.0 */
    onSome(callback: (value: T) => Async<unknown>): AsyncOption<T>
    /** @since v2.0.0 */
    onNone(callback: () => Async<unknown>): AsyncOption<T>
    /** @since v2.0.0 */
    onBoth(callback: (measured: T | undefined) => Async<unknown>): AsyncOption<T>
    /** @since v2.0.0 */
    bind<U>(binder: (value: T) => Async<Option<U>>): AsyncOption<U>
    /** @since v2.0.0 */
    map<U>(mapper: (value: T) => Async<U>): AsyncOption<U>
    /** @since v2.0.0 */
    wrapInside(): AsyncOption<Some<T>>
    /** @since v2.0.0 */
    wrapOutside(): AsyncOption<Option<T>>
    /** @since v2.0.0 */
    or<U>(factory: () => Async<Option<U>>): AsyncOption<T | U>
    /** @since v2.0.0 */
    elseIf<U>(condition: AsyncElseIfCondition, factory: () => Async<U>): AsyncOption<T | U>
    /** @since v2.0.0 */
    else<U>(factory: () => Async<U>): AsyncOption<T | U>
    /** @since v2.0.0 */
    filter(condition: (value: T) => Async<boolean>): AsyncOption<T>
    /** @since v2.0.0 */
    filter<U extends T>(condition: (value: T) => value is U): AsyncOption<U>
    /** @since v2.0.0 */
    get(errorFactory: () => Async<Error>): Promise<T>
    /** @since v2.0.0 */
    toResult<E = unknown>(errorFactory: () => Async<E>): AsyncResult<T, E>
}
/** @since v2.0.0 */
export type Async<T> = T | Promise<T>
type AsyncPredicate = () => Async<boolean>
/** @since v2.0.0 */
export type AsyncElseIfCondition = AsyncPredicate | Iterable<AsyncPredicate>
/** @since v2.0.0 */
export const AsyncOption: AsyncOptionConstructor = class AsyncOption<T> implements AsyncOptionInterface<T> {
    private readonly _option: Promise<Option<T>>
    private _value: Promise<T> | null = null
    private _hasValue: Promise<boolean> | null = null
    private _measured: Promise<T | undefined> | null = null
    get value(): Promise<T> {
        return this._value ??= this._option.then(option => option.hasValue
            ? option.value
            : Promise.reject(new ValueNotProvidedError()))
    }
    get hasValue(): Promise<boolean> {
        return this._hasValue ??= this._option.then(option => option.hasValue)
    }
    get measured(): Promise<T | undefined> {
        return this._measured ??= this._option.then(option => option.measured)
    }
    get [Symbol.toStringTag](): string {
        return AsyncOption.name
    }

    constructor(option: Async<Option<T>>) {
        this._option = promisify(option)
    }

    private _then<U>(callback: (option: Option<T>) => Async<Option<U>>): AsyncOption<U> {
        return new AsyncOption(this.then(callback))
    }
    onSome(callback: (value: T) => Async<unknown>): AsyncOption<T> {
        return this._then(option => option.onSome(callback))
    }
    onNone(callback: () => Async<unknown>): AsyncOption<T> {
        return this._then(option => option.onNone(callback))
    }
    onBoth(callback: (measured: T | undefined) => Async<unknown>): AsyncOption<T> {
        return this._then(option => option.onBoth(callback))
    }
    bind<U>(binder: (value: T) => Async<Option<U>>): AsyncOption<U> {
        return this._then<U>(option => option.hasValue
            ? binder(option.value)
            : NONE)
    }
    map<U>(mapper: (value: T) => Async<U>): AsyncOption<U> {
        return this.bind(pipeAsync(mapper, mapped => new Some(mapped)))
    }
    wrapInside(): AsyncOption<Some<T>> {
        return this._then(option => option.wrapInside())
    }
    wrapOutside(): AsyncOption<Option<T>> {
        return this._then<Option<T>>(option => option.wrapOutside())
    }
    or<U>(factory: () => Async<Option<U>>): AsyncOption<T | U> {
        return this._then<T | U>(option => option.hasValue
            ? option
            : factory())
    }
    elseIf<U>(condition: AsyncElseIfCondition, factory: () => Async<U>): AsyncOption<T | U> {
        return this._then(option => {
            if (option.hasValue) return option

            const subconditionResults: Promise<boolean>[] = []

            if (typeof condition === 'function') {
                const conditionResult = condition()

                if (isPromise(conditionResult))
                    subconditionResults.push(conditionResult)
                else
                    return conditionResult
                        ? then(factory(), value => new Some(value))
                        : option
            } else {
                for (const subcondition of condition) {
                    const subconditionResult = subcondition()

                    if (isPromise(subconditionResult))
                        subconditionResults.push(subconditionResult)
                    else if (!subconditionResult)
                        return option
                }
            }
            if (subconditionResults.length < 0.5)
                return then(factory(), value => new Some(value))

            const conditionPromise = subconditionResults.length < 1.5
                ? subconditionResults[0]
                : Promise.all(subconditionResults).then(results => results.every(_ => _))

            return conditionPromise
                .then(result => result
                    ? then(factory(), value => new Some(value))
                    : option)
        })
    }
    else<U>(factory: () => Async<U>): AsyncOption<T | U> {
        return this._then<T | U>(option => option.hasValue
            ? option
            : then(factory(), value => new Some(value)))
    }
    filter(condition: (value: T) => Async<boolean>): AsyncOption<T>
    filter<U extends T>(condition: (value: T) => value is U): AsyncOption<U>
    filter(condition: (value: T) => Async<boolean>): AsyncOption<T> {
        return this._then(option => option.hasValue
            ? then(condition(option.value), result => result ? option : NONE)
            : option)
    }
    get(errorFactory: () => Async<Error>): Promise<T> {
        return this.then(option => option.hasValue
            ? option.value
            : then(errorFactory(), error => Promise.reject(error)))
    }
    toResult<E = unknown>(errorFactory: () => Async<E>): AsyncResult<T, E> {
        return new AsyncResult(this.then(option => option.hasValue
            ? new Success(option.value)
            : then(errorFactory(), error => new Failure(error))))
    }
    then<F = Option<T>, R = never>(onResolved?: ((value: Option<T>) => F | PromiseLike<F>) | null | undefined, onRejected?: ((reason: any) => R | PromiseLike<R>) | null | undefined): Promise<F | R> {
        return this._option.then(onResolved, onRejected)
    }
    catch<R = never>(onRejected?: ((reason: any) => R | PromiseLike<R>) | null | undefined): Promise<Option<T> | R> {
        return this._option.catch(onRejected)
    }
    finally(callback?: (() => void) | null | undefined): Promise<Option<T>> {
        return this._option.finally(callback)
    }
}
interface AsyncOptionConstructor {
    readonly prototype: AsyncOption<any>

    new<T>(option: Async<Option<T>>): AsyncOption<T>
}
type AsyncOptionInterface<T> = AsyncOption<T>
/** @since v2.0.0 */
export type AsyncOptionLike<T> = PromiseLike<OptionLike<T>>

/** @since v2.0.0 */
export const ASYNC_NONE = new AsyncOption<never>(NONE)
