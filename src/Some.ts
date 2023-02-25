import { AsyncOption } from './async'
import { NONE, None } from './None'
import type { Option, OptionLike } from './Option'
import { Success } from './Success'

/** @since v2.0.0 */
export interface Some<T> {
    /** @since v2.0.0 */
    readonly value: T
    /** @since v2.0.0 */
    readonly hasValue: true
    /** @since v2.0.0 */
    readonly measured: T

    /** @since v2.0.0 */
    onSome(callback: (value: T) => unknown): this
    /** @since v2.0.0 */
    onNone(): this
    /** @since v2.0.0 */
    onBoth(callback: (measured: T) => unknown): this
    /** @since v2.0.0 */
    bind<U>(binder: (value: T) => OptionLike<U>): Option<U>
    /** @since v2.0.0 */
    map<U>(mapper: (value: T) => U): Some<U>
    /** @since v2.0.0 */
    wrapInside(): Some<this>
    /** @since v2.0.0 */
    wrapOutside(): Some<this>
    /** @since v2.0.0 */
    or(): this
    /** @since v2.0.0 */
    elseIf(): this
    /** @since v2.0.0 */
    else(): this
    /** @since v2.0.0 */
    filter(condition: (value: T) => boolean): this | None
    /** @since v2.0.0 */
    filter<U extends T>(condition: (value: T) => value is U): Option<U>
    /** @since v2.0.0 */
    get(): T
    /** @since v2.0.0 */
    toResult(): Success<T>
    /** @since v2.0.0 */
    toAsync(): AsyncOption<T>
}
/** @since v2.0.0 */
export const Some: SomeConstructor = class Some<T> implements SomeInterface<T> {
    get hasValue(): true {
        return true
    }
    get measured(): T {
        return this.value
    }

    constructor(readonly value: T) {}

    onSome(callback: (value: T) => unknown): this {
        callback(this.value)

        return this
    }
    onNone(): this {
        return this
    }
    onBoth(callback: (measured: T) => unknown): this {
        callback(this.measured)

        return this
    }
    bind<U>(binder: (value: T) => OptionLike<U>): Option<U> {
        const bound = binder(this.value)

        return bound instanceof Some || bound === NONE
            ? bound as any
            : bound.hasValue
                ? new Some(bound.value)
                : NONE
    }
    map<U>(mapper: (value: T) => U): Some<U> {
        return new Some(mapper(this.value))
    }
    wrapInside(): Some<this> {
        return new Some(this)
    }
    wrapOutside(): Some<this> {
        return new Some(this)
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
    filter(condition: (value: T) => boolean): this | None
    filter<U extends T>(condition: (value: T) => value is U): Option<U>
    filter(condition: (value: T) => boolean): this | None {
        return condition(this.value) ? this : NONE
    }
    get(): T {
        return this.value
    }
    toResult(): Success<T> {
        return new Success(this.value)
    }
    toAsync(): AsyncOption<T> {
        return new AsyncOption(this)
    }
}
type SomeInterface<T> = Some<T>
interface SomeConstructor {
    readonly prototype: Some<any>

    new<T>(value: T): Some<T>
}
/** @since v2.0.0 */
export interface SomeLike<T> {
    readonly value: T
    readonly hasValue: true
}
