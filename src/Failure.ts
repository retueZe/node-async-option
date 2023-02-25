import { AsyncResult } from './async'
import { NONE, None } from './None'
import type { OptionLike } from './Option'
import type { Result } from './Result'
import { Success } from './Success'
import { ValueNotProvidedError } from './ValueNotProvidedError'

/** @since v2.0.0 */
export interface Failure<E = unknown> {
    /** @since v2.0.0 */
    readonly value: never
    /** @since v2.0.0 */
    readonly error: E
    /** @since v2.0.0 */
    readonly isSucceeded: false
    /** @since v2.0.0 */
    readonly measured: E

    /** @since v2.0.0 */
    onSuccess(): this
    /** @since v2.0.0 */
    onFailure(callback: (error: E) => unknown): this
    /** @since v2.0.0 */
    onBoth(callback: (measured: E) => unknown): this
    /** @since v2.0.0 */
    swap(): Success<E>
    /** @since v2.0.0 */
    bind(): this
    /** @since v2.0.0 */
    bindError<R extends Result<any, any>>(binder: (error: E) => R): R
    /** @since v2.0.0 */
    map(): this
    /** @since v2.0.0 */
    mapError<U>(mapper: (error: E) => U): Failure<U>
    /** @since v2.0.0 */
    or<R extends Result<any, any>>(factory: (error: E) => R): R
    /** @since v2.0.0 */
    elseIf<T>(condition: FailureElseIfCondition<E>, factory: (error: E) => T): Success<T> | this
    /** @since v2.0.0 */
    else<T>(factory: (error: E) => T): Success<T>
    /** @since v2.0.0 */
    filter(): this
    /** @since v2.0.0 */
    filterError<T>(condition: (error: E) => OptionLike<T>): Success<T> | this
    /** @since v2.0.0 */
    get(errorFactory: (error: E) => Error): never
    /** @since v2.0.0 */
    getError(): E
    /** @since v2.0.0 */
    toOption(): None
    /** @since v2.0.0 */
    toAsync(): AsyncResult<never, E>
}
type ErrorPredicate<E = unknown> = (error: E) => boolean
/** @since v2.0.0 */
export type FailureElseIfCondition<E = unknown> = ErrorPredicate<E> | Iterable<ErrorPredicate<E>>
/** @since v2.0.0 */
export type GenericFailureError<M> = ({
    [R in keyof M]: {reason: R} & M[R]
})[keyof M]
/** @since v2.0.0 */
export const Failure: FailureConstructor = class Failure<E = unknown> implements FailureInterface<E> {
    get value(): never {
        throw new ValueNotProvidedError()
    }
    get isSucceeded(): false {
        return false
    }
    get measured(): E {
        return this.error
    }

    constructor(readonly error: E) {}

    onSuccess(): this {
        return this
    }
    onFailure(callback: (error: E) => unknown): this {
        callback(this.error)

        return this
    }
    onBoth(callback: (measured: E) => unknown): this {
        callback(this.measured)

        return this
    }
    swap(): Success<E> {
        return new Success(this.error)
    }
    bind(): this {
        return this
    }
    bindError<R extends Result<any, any>>(binder: (error: E) => R): R {
        return binder(this.error)
    }
    map(): this {
        return this
    }
    mapError<U>(mapper: (error: E) => U): Failure<U> {
        return new Failure(mapper(this.error))
    }
    or<R extends Result<any, any>>(factory: (error: E) => R): R {
        return factory(this.error)
    }
    elseIf<T>(condition: FailureElseIfCondition<E>, factory: (error: E) => T): this | Success<T> {
        if (typeof condition === 'function') {
            if (!condition(this.error)) return this
        } else {
            for (const subcondition of condition)
                if (!subcondition(this.error))
                    return this
        }

        return new Success(factory(this.error))
    }
    else<T>(factory: (error: E) => T): Success<T> {
        return new Success(factory(this.error))
    }
    filter(): this {
        return this
    }
    filterError<T>(condition: (error: E) => OptionLike<T>): Success<T> | this {
        const conditionResult = condition(this.error)

        // TSC is not smart enough to pass this without `as any`
        return conditionResult.hasValue
            ? new Success(conditionResult.value) as any
            : this
    }
    get(errorFactory: (error: E) => Error): never {
        throw errorFactory(this.error)
    }
    getError(): E {
        return this.error
    }
    toOption(): None {
        return NONE
    }
    toAsync(): AsyncResult<never, E> {
        return new AsyncResult<never, E>(this)
    }
}
interface FailureConstructor {
    readonly prototype: Failure<any>

    new<E = unknown>(error: E): Failure<E>
}
type FailureInterface<E = unknown> = Failure<E>
/** @since v2.0.0 */
export interface FailureLike<E = unknown> {
    readonly value: never
    readonly error: E
    readonly isSucceeded: false
}
