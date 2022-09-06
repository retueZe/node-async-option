export interface IOption<T> {
    readonly value: T
    readonly hasValue: boolean
    readonly measured: T | undefined

    onSome(callback: (value: T) => void): this
    onNone(callback: () => void): this
    onBoth(callback: (measured: T | undefined) => void): this
    bind<U>(binder: (value: T) => IOption<U>): IOption<U>
    map<U>(mapper: (value: T) => U): IOption<U>
    zip<U>(option: IOption<U>): IOption<[T, U]>
    zip<U>(factory: (value: T) => IOption<U>): IOption<[T, U]>
    or<U>(factory: () => U): T | U
    get(errorFactory: () => Error): T
    toResult<E>(errorFactory: () => E): IResult<T, E>
    toAsync(): IAsyncOption<T>
}
export interface IResult<T, E = any> {
    readonly value: T
    readonly error: E
    readonly isSucceeded: boolean
    readonly measured: T | E

    onSuccess(callback: (value: T) => void): this
    onFailure(callback: (error: E) => void): this
    onBoth(callback: (measured: T | E) => void): this
    swap(): IResult<E, T>
    cast(): IResult<never, E>
    bind<U>(binder: (value: T) => IResult<U, E>): IResult<U, E>
    bindError<U>(binder: (error: E) => IResult<T, U>): IResult<T, U>
    map<U>(mapper: (value: T) => U): IResult<U, E>
    mapError<U>(mapper: (error: E) => U): IResult<T, U>
    zip<U>(result: IResult<U, E>): IResult<[T, U], E>
    zip<U>(factory: (value: T) => IResult<U, E>): IResult<[T, U], E>
    or<U>(factory: (error: E) => U): T | U
    get(errorFactory: (error: E) => Error): T
    toOption(): IOption<T>
    toAsync(): IAsyncResult<T, E>
}

export type Async<T> = T | Promise<T>
export function isPromise(value: unknown): value is Promise<unknown> {
    return (typeof value === 'object' || typeof value === 'function') && 'then' in value
}
export function callAsync<T, U>(async: Async<T>, callback: (value: T) => Async<U>): Async<U> {
    return isPromise(async)
        ? async.then(value => callback(value))
        : callback(async)
}
export function promisify<T>(async: Async<T>): Promise<T> {
    return isPromise(async)
        ? async
        : Promise.resolve(async)
}

export interface IAsyncOption<T> extends Promise<IOption<T>> {
    readonly value: Promise<T>
    readonly hasValue: Promise<boolean>
    readonly measured: Promise<T | undefined>

    onSome(callback: (value: T) => Async<void>): IAsyncOption<T>
    onNone(callback: () => Async<void>): IAsyncOption<T>
    onBoth(callback: (measured: T | undefined) => Async<void>): IAsyncOption<T>
    bind<U>(binder: (value: T) => Async<IOption<U>>): IAsyncOption<U>
    map<U>(mapper: (value: T) => Async<U>): IAsyncOption<U>
    zip<U>(option: Async<IOption<U>>): IAsyncOption<[T, U]>
    zip<U>(factory: (value: T) => Async<IOption<U>>): IAsyncOption<[T, U]>
    or<U>(factory: () => Async<U>): Promise<T | U>
    get(errorFactory: () => Error): Promise<T>
    toResult<E>(errorFactory: () => Async<E>): IAsyncResult<T, E>
}
export interface IAsyncResult<T, E = any> extends Promise<IResult<T, E>> {
    readonly value: Promise<T>
    readonly error: Promise<E>
    readonly isSucceeded: Promise<boolean>
    readonly measured: Promise<T | E>

    onSuccess(callback: (value: T) => Async<void>): IAsyncResult<T, E>
    onFailure(callback: (error: E) => Async<void>): IAsyncResult<T, E>
    onBoth(callback: (measured: T | E) => Async<void>): IAsyncResult<T, E>
    swap(): IAsyncResult<E, T>
    cast(): IAsyncResult<never, E>
    bind<U>(binder: (value: T) => Async<IResult<U, E>>): IAsyncResult<U, E>
    bindError<U>(binder: (error: E) => Async<IResult<T, U>>): IAsyncResult<T, U>
    map<U>(mapper: (value: T) => Async<U>): IAsyncResult<U, E>
    mapError<U>(mapper: (error: E) => Async<U>): IAsyncResult<T, U>
    zip<U>(result: Async<IResult<U, E>>): IAsyncResult<[T, U], E>
    zip<U>(factory: (value: T) => Async<IResult<U, E>>): IAsyncResult<[T, U], E>
    or<U>(factory: (error: E) => Async<U>): Promise<T | U>
    get(errorFactory: (error: E) => Error): Promise<T>
    toOption(): IAsyncOption<T>
}
