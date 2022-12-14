import { IAsyncOption, IAsyncResult, IOption, IResult, promisify } from '../abstraction'
import { ValueNotProvidedError } from '../ValueNotProvidedError'
import { AsyncMonadCallbacks, AsyncOptionImpl, AsyncResultImpl } from './async'

export const ASYNC_MONAD_CALLBACKS: AsyncMonadCallbacks = {
    some: <T>(value: T) => new Some(value),
    success: <T>(value: T) => new Success(value),
    failure: <E>(error: E) => new Failure(error)
}

export class Some<T> implements IOption<T> {
    get hasValue(): true {
        return true
    }
    get measured(): T {
        return this.value
    }

    constructor(readonly value: T) {}

    onSome(callback: (value: T) => void): this {
        callback(this.value)

        return this
    }
    onNone(): this {
        return this
    }
    onBoth(callback: (measured: T | undefined) => void): this {
        callback(this.value)

        return this
    }
    bind<U>(binder: (value: T) => IOption<U>): IOption<U> {
        return binder(this.value)
    }
    map<U>(mapper: (value: T) => U): IOption<U> {
        return new Some(mapper(this.value))
    }
    wrap(): IOption<IOption<T>> {
        return this.map(value => new Some(value))
    }
    wrapOr(): this {
        return this
    }
    wrapOutside(): IOption<IOption<T>> {
        return new Some(this)
    }
    assert(condition: (value: T) => boolean): IOption<T> {
        return condition(this.value) ? this : NONE
    }
    zip<U>(option: IOption<U>): IOption<[T, U]>
    zip<U>(factory: (value: T) => IOption<U>): IOption<[T, U]>
    zip<U>(firstArg: IOption<U> | ((value: T) => IOption<U>)): IOption<[T, U]> {
        if (typeof firstArg === 'function') firstArg = firstArg(this.value)

        return firstArg.map(otherValue => [this.value, otherValue])
    }
    or(): T {
        return this.value
    }
    get(): T {
        return this.value
    }
    toResult(): IResult<T, never> {
        return new Success(this.value)
    }
    toAsync(): IAsyncOption<T> {
        return new AsyncOptionImpl(promisify(this), ASYNC_MONAD_CALLBACKS)
    }
}
export class None implements IOption<never> {
    get value(): never {
        throw new ValueNotProvidedError()
    }
    get hasValue(): false {
        return false
    }
    get measured(): never {
        return undefined as never
    }

    onSome(): this {
        return this
    }
    onNone(callback: () => void): this {
        callback()

        return this
    }
    onBoth(callback: (measured: never) => void): this {
        callback(undefined as never)

        return this
    }
    bind(): this {
        return this
    }
    map(): this {
        return this
    }
    wrap(): this {
        return this
    }
    wrapOr<U>(factory: () => IOption<U>): IOption<U> {
        return factory()
    }
    wrapOutside(): IOption<IOption<never>> {
        return new Some(this)
    }
    assert(): this {
        return this
    }
    zip(): this {
        return this
    }
    or<U>(factory: () => U): U {
        return factory()
    }
    get(errorFactory: () => Error): never {
        throw errorFactory()
    }
    toResult<E>(errorFactory: () => E): IResult<never, E> {
        return new Failure(errorFactory())
    }
    toAsync(): IAsyncOption<never> {
        return ASYNC_NONE
    }
}
export const NONE: IOption<never> = new None()
export const ASYNC_NONE: IAsyncOption<never> = new AsyncOptionImpl(promisify(NONE), ASYNC_MONAD_CALLBACKS)

export class Success<T> implements IResult<T, never> {
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

    onSuccess(callback: (value: T) => void): this {
        callback(this.value)

        return this
    }
    onFailure(): this {
        return this
    }
    onBoth(callback: (measured: T) => void): this {
        callback(this.value)

        return this
    }
    swap(): IResult<never, T> {
        return new Failure(this.value)
    }
    cast(): never {
        throw new ValueNotProvidedError()
    }
    bind<U>(binder: (value: T) => IResult<U, never>): IResult<U, never> {
        return binder(this.value)
    }
    bindError(): this {
        return this
    }
    map<U>(mapper: (value: T) => U): IResult<U, never> {
        return new Success(mapper(this.value))
    }
    mapError(): this {
        return this
    }
    assert<E>(condition: (value: T) => IOption<E>): IResult<T, E> {
        return condition(this.value)
            .toResult(() => this.value)
            .swap()
    }
    assertError(): this {
        return this
    }
    zip<U>(result: IResult<U, never>): IResult<[T, U], never>
    zip<U>(factory: (value: T) => IResult<U, never>): IResult<[T, U], never>
    zip<U>(firstArg: IResult<U, never> | ((value: T) => IResult<U, never>)): IResult<[T, U], never> {
        if (typeof firstArg === 'function') firstArg = firstArg(this.value)

        return firstArg.map(otherValue => [this.value, otherValue])
    }
    or(): T {
        return this.value
    }
    get(): T {
        return this.value
    }
    toOption(): IOption<T> {
        return new Some(this.value)
    }
    toAsync(): IAsyncResult<T, never> {
        return new AsyncResultImpl<T, never>(promisify(this), ASYNC_MONAD_CALLBACKS)
    }
}
export class Failure<E> implements IResult<never, E> {
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
    onFailure(callback: (error: E) => void): this {
        callback(this.error)

        return this
    }
    onBoth(callback: (measured: E) => void): this {
        callback(this.error)

        return this
    }
    swap(): IResult<E, never> {
        return new Success(this.error)
    }
    cast(): this {
        return this
    }
    bind(): this {
        return this
    }
    bindError<U>(binder: (error: E) => IResult<never, U>): IResult<never, U> {
        return binder(this.error)
    }
    map(): this {
        return this
    }
    mapError<U>(mapper: (error: E) => U): IResult<never, U> {
        return new Failure(mapper(this.error))
    }
    assert(): this {
        return this
    }
    assertError<T>(condition: (error: E) => IOption<T>): IResult<T, E> {
        return condition(this.error)
            .toResult(() => this.error)
    }
    zip(): this {
        return this
    }
    or<U>(factory: (error: E) => U): U {
        return factory(this.error)
    }
    get(errorFactory: (error: E) => Error): never {
        throw errorFactory(this.error)
    }
    toOption(): IOption<never> {
        return NONE
    }
    toAsync(): IAsyncResult<never, E> {
        return new AsyncResultImpl<never, E>(promisify(this), ASYNC_MONAD_CALLBACKS)
    }
}
