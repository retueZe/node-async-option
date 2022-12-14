/** @since v1.0.0 */
export interface IOption<T> {
    /** @since v1.0.0 */
    readonly value: T
    /** @since v1.0.0 */
    readonly hasValue: boolean
    /** @since v1.0.0 */
    readonly measured: T | undefined

    /** @since v1.0.0 */
    onSome(callback: (value: T) => void): this
    /** @since v1.0.0 */
    onNone(callback: () => void): this
    /** @since v1.0.0 */
    onBoth(callback: (measured: T | undefined) => void): this
    /** @since v1.0.0 */
    bind<U>(binder: (value: T) => IOption<U>): IOption<U>
    /** @since v1.0.0 */
    map<U>(mapper: (value: T) => U): IOption<U>
    /**
     * `this.map(value => Option.some(value))`
     * @since v1.5.0
     */
    wrap(): IOption<IOption<T>>
    /**
     * `this.wrap().or(factory)`
     * @since v1.5.0
     */
    wrapOr<U>(factory: () => IOption<U>) : IOption<T | U>
    /**
     * `Option.some(this)`
     * @since v1.12.0
     */
    wrapOutside(): IOption<IOption<T>>
    /** @since v1.1.0 */
    assert(condition: (value: T) => boolean): IOption<T>
    /** @since v1.1.0 */
    assert<U extends T>(condition: (value: T) => value is U): IOption<U>
    /** @since v1.0.0 */
    zip<U>(option: IOption<U>): IOption<[T, U]>
    /** @since v1.0.0 */
    zip<U>(factory: (value: T) => IOption<U>): IOption<[T, U]>
    /** @since v1.0.0 */
    or<U>(factory: () => U): T | U
    /** @since v1.0.0 */
    get(errorFactory: () => Error): T
    /** @since v1.0.0 */
    toResult<E>(errorFactory: () => E): IResult<T, E>
    /** @since v1.0.0 */
    toAsync(): IAsyncOption<T>
}
/** @since v1.0.0 */
export interface IResult<T, E = any> {
    /** @since v1.0.0 */
    readonly value: T
    /** @since v1.0.0 */
    readonly error: E
    /** @since v1.0.0 */
    readonly isSucceeded: boolean
    /** @since v1.0.0 */
    readonly measured: T | E

    /** @since v1.0.0 */
    onSuccess(callback: (value: T) => void): this
    /** @since v1.0.0 */
    onFailure(callback: (error: E) => void): this
    /** @since v1.0.0 */
    onBoth(callback: (measured: T | E) => void): this
    /** @since v1.0.0 */
    swap(): IResult<E, T>
    /** @since v1.0.0 */
    cast(): IResult<never, E>
    /** @since v1.0.0 */
    bind<U>(binder: (value: T) => IResult<U, E>): IResult<U, E>
    /** @since v1.0.0 */
    bindError<U>(binder: (error: E) => IResult<T, U>): IResult<T, U>
    /** @since v1.0.0 */
    map<U>(mapper: (value: T) => U): IResult<U, E>
    /** @since v1.0.0 */
    mapError<U>(mapper: (error: E) => U): IResult<T, U>
    /** @since v1.1.0 */
    assert(condition: (value: T) => IOption<E>): IResult<T, E>
    /** @since v1.1.0 */
    assertError(condition: (error: E) => IOption<T>): IResult<T, E>
    /** @since v1.0.0 */
    zip<U>(result: IResult<U, E>): IResult<[T, U], E>
    /** @since v1.0.0 */
    zip<U>(factory: (value: T) => IResult<U, E>): IResult<[T, U], E>
    /** @since v1.0.0 */
    or<U>(factory: (error: E) => U): T | U
    /** @since v1.0.0 */
    get(errorFactory: (error: E) => Error): T
    /** @since v1.0.0 */
    toOption(): IOption<T>
    /** @since v1.0.0 */
    toAsync(): IAsyncResult<T, E>
}

/** @since v1.0.0 */
export type Async<T> = T | Promise<T>
/** @since v1.0.0 */
export function isPromise(value: unknown): value is Promise<unknown> {
    return (typeof value === 'object' || typeof value === 'function') && value !== null && 'then' in value
}
/** @since v1.0.0 */
export function callAsync<T, U = T>(async: Async<T>, callback?: ((value: T) => Async<U>) | null): Async<U> {
    callback ??= _ => _ as any

    return isPromise(async)
        ? async.then(value => callback(value))
        : callback(async)
}
/** @since v1.0.0 */
export function promisify<T>(async: Async<T>): Promise<T> {
    return isPromise(async)
        ? async
        : Promise.resolve(async)
}

/** @since v1.0.0 */
export interface IAsyncOption<T> extends Promise<IOption<T>> {
    /** @since v1.0.0 */
    readonly value: Promise<T>
    /** @since v1.0.0 */
    readonly hasValue: Promise<boolean>
    /** @since v1.0.0 */
    readonly measured: Promise<T | undefined>

    /** @since v1.0.0 */
    onSome(callback: (value: T) => Async<void>): IAsyncOption<T>
    /** @since v1.0.0 */
    onNone(callback: () => Async<void>): IAsyncOption<T>
    /** @since v1.0.0 */
    onBoth(callback: (measured: T | undefined) => Async<void>): IAsyncOption<T>
    /** @since v1.0.0 */
    bind<U>(binder: (value: T) => Async<IOption<U>>): IAsyncOption<U>
    /** @since v1.0.0 */
    map<U>(mapper: (value: T) => Async<U>): IAsyncOption<U>
    /** @since v1.5.0 */
    wrap(): IAsyncOption<IOption<T>>
    /** @since v1.5.0 */
    wrapOr<U>(factory: () => Async<IOption<U>>): IAsyncOption<T | U>
    /** @since v1.12.0 */
    wrapOutside(): IAsyncOption<IOption<T>>
    /** @since v1.1.0 */
    assert(condition: (value: T) => Async<boolean>): IAsyncOption<T>
    /** @since v1.1.0 */
    assert<U extends T>(condition: (value: T) => value is U): IAsyncOption<U>
    /** @since v1.0.0 */
    zip<U>(option: Async<IOption<U>>): IAsyncOption<[T, U]>
    /** @since v1.0.0 */
    zip<U>(factory: (value: T) => Async<IOption<U>>): IAsyncOption<[T, U]>
    /** @since v1.0.0 */
    or<U>(factory: () => Async<U>): Promise<T | U>
    /** @since v1.0.0 */
    get(errorFactory: () => Error): Promise<T>
    /** @since v1.0.0 */
    toResult<E>(errorFactory: () => Async<E>): IAsyncResult<T, E>
}
/** @since v1.0.0 */
export interface IAsyncResult<T, E = any> extends Promise<IResult<T, E>> {
    /** @since v1.0.0 */
    readonly value: Promise<T>
    /** @since v1.0.0 */
    readonly error: Promise<E>
    /** @since v1.0.0 */
    readonly isSucceeded: Promise<boolean>
    /** @since v1.0.0 */
    readonly measured: Promise<T | E>

    /** @since v1.0.0 */
    onSuccess(callback: (value: T) => Async<void>): IAsyncResult<T, E>
    /** @since v1.0.0 */
    onFailure(callback: (error: E) => Async<void>): IAsyncResult<T, E>
    /** @since v1.0.0 */
    onBoth(callback: (measured: T | E) => Async<void>): IAsyncResult<T, E>
    /** @since v1.0.0 */
    swap(): IAsyncResult<E, T>
    /** @since v1.0.0 */
    cast(): IAsyncResult<never, E>
    /** @since v1.0.0 */
    bind<U>(binder: (value: T) => Async<IResult<U, E>>): IAsyncResult<U, E>
    /** @since v1.0.0 */
    bindError<U>(binder: (error: E) => Async<IResult<T, U>>): IAsyncResult<T, U>
    /** @since v1.0.0 */
    map<U>(mapper: (value: T) => Async<U>): IAsyncResult<U, E>
    /** @since v1.0.0 */
    mapError<U>(mapper: (error: E) => Async<U>): IAsyncResult<T, U>
    /** @since v1.1.0 */
    assert(condition: (value: T) => Async<IOption<E>>): IAsyncResult<T, E>
    /** @since v1.1.0 */
    assertError(condition: (error: E) => Async<IOption<T>>): IAsyncResult<T, E>
    /** @since v1.0.0 */
    zip<U>(result: Async<IResult<U, E>>): IAsyncResult<[T, U], E>
    /** @since v1.0.0 */
    zip<U>(factory: (value: T) => Async<IResult<U, E>>): IAsyncResult<[T, U], E>
    /** @since v1.0.0 */
    or<U>(factory: (error: E) => Async<U>): Promise<T | U>
    /** @since v1.0.0 */
    get(errorFactory: (error: E) => Error): Promise<T>
    /** @since v1.0.0 */
    toOption(): IAsyncOption<T>
}
