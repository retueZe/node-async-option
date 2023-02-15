import { AsyncResult } from './async'
import { Failure } from './Failure'
import type { Option, ValueOf } from './Option'
import type { Result } from './Result'
import { Some } from './Some'
import { ValueNotProvidedError } from './ValueNotProvidedError'

/** @since v2.0.0 */
export interface Success<T> {
    /** @since v2.0.0 */
    readonly value: T
    /** @since v2.0.0 */
    readonly error: never
    /** @since v2.0.0 */
    readonly isSucceeded: true
    /** @since v2.0.0 */
    readonly measured: T

    /** @since v2.0.0 */
    onSuccess(callback: (value: T) => unknown): this
    /** @since v2.0.0 */
    onFailure(): this
    /** @since v2.0.0 */
    onBoth(callback: (measured: T) => unknown): this
    /** @since v2.0.0 */
    swap(): Failure<T>
    /** @since v2.0.0 */
    bind<O extends Result<any, any>>(binder: (value: T) => O): O
    /** @since v2.0.0 */
    bindError(): this
    /** @since v2.0.0 */
    map<U>(mapper: (value: T) => U): Success<U>
    /** @since v2.0.0 */
    mapError(): this
    /** @since v2.0.0 */
    or(): this
    /** @since v2.0.0 */
    elseIf(): this
    /** @since v2.0.0 */
    else(): this
    /** @since v2.0.0 */
    filter<O extends Option<any> = Option<any>>(condition: (value: T) => O): filterValueResult<this, O>
    /** @since v2.0.0 */
    filterError(): this
    /** @since v2.0.0 */
    get(): T
    /** @since v2.0.0 */
    getError(errorFactory: () => Error): never
    /** @since v2.0.0 */
    toOption(): Some<T>
    /** @since v2.0.0 */
    toAsync(): AsyncResult<T, never>
}
type filterValueResult<S extends Success<any>, O extends Option<any>> = O['hasValue'] extends true
    ? Failure<ValueOf<O>>
    : S
/** @since v2.0.0 */
export const Success: SuccessConstructor = class Success<T> implements SuccessInterface<T> {
    get error(): never {
        throw new ValueNotProvidedError()
    }
    get isSucceeded(): true {
        return true
    }
    get measured(): T {
        return this.value
    }

    constructor(readonly value: T) {}

    onSuccess(callback: (value: T) => unknown): this {
        callback(this.value)

        return this
    }
    onFailure(): this {
        return this
    }
    onBoth(callback: (measured: T) => unknown): this {
        callback(this.measured)

        return this
    }
    swap(): Failure<T> {
        return new Failure(this.value)
    }
    bind<O extends Result<any, any>>(binder: (value: T) => O): O {
        return binder(this.value)
    }
    bindError(): this {
        return this
    }
    map<U>(mapper: (value: T) => U): Success<U> {
        return new Success(mapper(this.value))
    }
    mapError(): this {
        return this
    }
    or(): this {
        return this
    }
    elseIf(): this {
        return this
    }
    else(): this {
        return this
    }
    filter<O extends Option<any>>(condition: (value: T) => O): filterValueResult<this, O> {
        const conditionResult = condition(this.value)

        // TSC is not smart enough to pass this without `as any`
        return conditionResult.hasValue
            ? new Failure(conditionResult.value) as any
            : this
    }
    filterError(): this {
        return this
    }
    get(): T {
        return this.value
    }
    getError(errorFactory: () => Error): never {
        throw errorFactory()
    }
    toOption(): Some<T> {
        return new Some(this.value)
    }
    toAsync(): AsyncResult<T, never> {
        return new AsyncResult<T, never>(this)
    }
}
interface SuccessConstructor {
    readonly prototype: Success<any>

    new<T>(value: T): Success<T>
}
type SuccessInterface<T> = Success<T>
