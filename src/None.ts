import { AsyncOption, ASYNC_NONE } from './async'
import { Failure } from './Failure'
import type { Option } from './Option'
import { Some } from './Some'
import { ValueNotProvidedError } from './ValueNotProvidedError'

/** @since v2.0.0 */
export interface None {
    /** @since v2.0.0 */
    readonly value: never
    /** @since v2.0.0 */
    readonly hasValue: false
    /** @since v2.0.0 */
    readonly measured: undefined

    /** @since v2.0.0 */
    onSome(): this
    /** @since v2.0.0 */
    onNone(callback: () => unknown): this
    /** @since v2.0.0 */
    onBoth(callback: (measured: undefined) => unknown): this
    /** @since v2.0.0 */
    bind(): this
    /** @since v2.0.0 */
    map(): this
    /** @since v2.0.0 */
    wrapInside(): this
    /** @since v2.0.0 */
    wrapOutside(): Some<this>
    /** @since v2.0.0 */
    or<O extends Option<any>>(factory: () => O): O
    /** @since v2.0.0 */
    elseIf<U>(condition: ElseIfCondition, factory: () => U): Some<U> | this
    /** @since v2.0.0 */
    else<U>(factory: () => U): Some<U>
    /** @since v2.0.0 */
    filter(): this
    /** @since v2.0.0 */
    get(errorFactory: () => Error): never
    /** @since v2.0.0 */
    toResult<E = unknown>(factory: () => E): Failure<E>
    /** @since v2.0.0 */
    toAsync(): AsyncOption<never>
}
type Predicate = () => boolean
type ElseIfCondition = Predicate | Iterable<Predicate>
const None = class None implements NoneInterface {
    get value(): never {
        throw new ValueNotProvidedError()
    }
    get hasValue(): false {
        return false
    }
    get measured(): undefined {
        return undefined
    }

    onSome(): this {
        return this
    }
    onNone(callback: () => unknown): this {
        callback()

        return this
    }
    onBoth(callback: (measured: undefined) => unknown): this {
        callback(this.measured)

        return this
    }
    bind(): this {
        return this
    }
    map(): this {
        return this
    }
    wrapInside(): this {
        return this
    }
    wrapOutside(): Some<this> {
        return new Some(this)
    }
    or<U, O extends Option<U> = Option<U>>(factory: () => O): O {
        return factory()
    }
    elseIf<U>(condition: ElseIfCondition, factory: () => U): Some<U> | this {
        if (typeof condition === 'function') {
            if (!condition()) return this
        } else {
            for (const subcondition of condition)
                if (!subcondition()) return this
        }

        return new Some(factory())
    }
    else<U>(factory: () => U): Some<U> {
        return new Some(factory())
    }
    filter(): this {
        return this
    }
    get(errorFactory: () => Error): never {
        throw errorFactory()
    }
    toResult<E = unknown>(factory: () => E): Failure<E> {
        return new Failure(factory())
    }
    toAsync(): AsyncOption<never> {
        throw ASYNC_NONE
    }
}
type NoneInterface = None
/** @since v2.0.0 */
export const NONE: None = new None()
