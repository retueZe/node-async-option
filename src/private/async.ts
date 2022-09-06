import { Async, callAsync, IAsyncOption, IAsyncResult, IOption, IResult } from '../abstraction'

export class AsyncOptionImpl<T> implements IAsyncOption<T> {
    private readonly _promise: Promise<IOption<T>>
    private readonly _callbacks: AsyncMonadCallbacks
    private _value: Promise<T> | null = null
    private _hasValue: Promise<boolean> | null = null
    private _measured: Promise<T | undefined> | null = null
    get value(): Promise<T> {
        return this._value ??= this.then(option => option.hasValue
            ? option.value
            : Promise.reject())
    }
    get hasValue(): Promise<boolean> {
        return this._hasValue ??= this.then(option => option.hasValue)
    }
    get measured(): Promise<T | undefined> {
        return this._measured ??= this.then(option => option.measured)
    }
    get [Symbol.toStringTag](): string {
        return 'AsyncOptionImpl'
    }

    constructor(promise: Promise<IOption<T>>, callbacks: AsyncMonadCallbacks) {
        this._promise = promise
        this._callbacks = callbacks
    }

    private _then<U>(callback: (option: IOption<T>) => Async<IOption<U>>): IAsyncOption<U> {
        return new AsyncOptionImpl(this.then(callback), this._callbacks)
    }
    onSome(callback: (value: T) => Async<void>): IAsyncOption<T> {
        return this._then(option => option.onSome(callback))
    }
    onNone(callback: () => Async<void>): IAsyncOption<T> {
        return this._then(option => option.onNone(callback))
    }
    onBoth(callback: (measured: T) => Async<void>): IAsyncOption<T> {
        return this._then(option => option.onBoth(callback))
    }
    bind<U>(binder: (value: T) => Async<IOption<U>>): IAsyncOption<U> {
        return this._then(option => option.hasValue
            ? binder(option.value)
            : option as IOption<never>)
    }
    map<U>(mapper: (value: T) => Async<U>): IAsyncOption<U> {
        return this.bind(value => callAsync(mapper(value), this._callbacks.some))
    }
    zip<U>(option: Async<IOption<U>>): IAsyncOption<[T, U]>
    zip<U>(factory: (value: T) => Async<IOption<U>>): IAsyncOption<[T, U]>
    zip<U>(firstArg: Async<IOption<U>> | ((value: T) => Async<IOption<U>>)): IAsyncOption<[T, U]> {
        return this.bind(value => {
            if (typeof firstArg === 'function') firstArg = firstArg(value)

            return callAsync(firstArg, option => option.map(otherValue => [value, otherValue]))
        })
    }
    or<U>(factory: () => Async<U>): Promise<T | U> {
        return this.then(option => option.hasValue
            ? option.value
            : factory())
    }
    get(errorFactory: () => Error): Promise<T> {
        return this.then(option => option.hasValue
            ? option.value
            : Promise.reject(errorFactory()))
    }
    toResult<E>(errorFactory: () => Async<E>): IAsyncResult<T, E> {
        return new AsyncResultImpl(this.then(option => option.toResult(() => undefined)), this._callbacks)
            .mapError(() => errorFactory())
    }
    then<R1 = IOption<T>, R2 = never>(onResolved?: (value: IOption<T>) => R1 | PromiseLike<R1>, onRejected?: (reason: any) => R2 | PromiseLike<R2>): Promise<R1 | R2> {
        return this._promise.then(onResolved, onRejected)
    }
    catch<R = never>(onRejected?: (reason: any) => R | PromiseLike<R>): Promise<IOption<T> | R> {
        return this._promise.catch(onRejected)
    }
    finally(callback?: () => void): Promise<IOption<T>> {
        return this._promise.finally(callback)
    }
}
export class AsyncResultImpl<T, E> implements IAsyncResult<T, E> {
    private readonly _promise: Promise<IResult<T, E>>
    private readonly _callbacks: AsyncMonadCallbacks
    private _value: Promise<T> | null = null
    private _error: Promise<E> | null = null
    private _isSucceeded: Promise<boolean> | null = null
    private _measured: Promise<T | E> | null = null
    get value(): Promise<T> {
        return this._value ??= this.then(result => result.isSucceeded
            ? result.value
            : Promise.reject())
    }
    get error(): Promise<E> {
        return this._error ??= this.then(result => result.isSucceeded
            ? Promise.reject()
            : result.error)
    }
    get isSucceeded(): Promise<boolean> {
        return this._isSucceeded ??= this.then(result => result.isSucceeded)
    }
    get measured(): Promise<T | E> {
        return this._measured ??= this.then(result => result.measured)
    }
    get [Symbol.toStringTag](): string {
        return 'AsyncResultImpl'
    }

    constructor(promise: Promise<IResult<T, E>>, callbacks: AsyncMonadCallbacks) {
        this._promise = promise
        this._callbacks = callbacks
    }

    private _then<UT, UE>(callback: (result: IResult<T, E>) => Async<IResult<UT, UE>>): IAsyncResult<UT, UE> {
        return new AsyncResultImpl(this.then(callback), this._callbacks)
    }
    onSuccess(callback: (value: T) => Async<void>): IAsyncResult<T, E> {
        return this._then(result => result.onSuccess(callback))
    }
    onFailure(callback: (error: E) => Async<void>): IAsyncResult<T, E> {
        return this._then(result => result.onFailure(callback))
    }
    onBoth(callback: (measured: T | E) => Async<void>): IAsyncResult<T, E> {
        return this._then(result => result.onBoth(callback))
    }
    swap(): IAsyncResult<E, T> {
        return this._then(result => result.swap())
    }
    cast(): IAsyncResult<never, E> {
        return this._then(result => result.cast())
    }
    bind<U>(binder: (value: T) => Async<IResult<U, E>>): IAsyncResult<U, E> {
        return this._then(result => result.isSucceeded
            ? binder(result.value)
            : result.cast())
    }
    bindError<U>(binder: (error: E) => Async<IResult<T, U>>): IAsyncResult<T, U> {
        return this._then(result => result.isSucceeded
            ? result as IResult<T, never>
            : binder(result.error))
    }
    map<U>(mapper: (value: T) => Async<U>): IAsyncResult<U, E> {
        return this.bind(value => callAsync(mapper(value), this._callbacks.success))
    }
    mapError<U>(mapper: (error: E) => Async<U>): IAsyncResult<T, U> {
        return this.bindError(value => callAsync(mapper(value), this._callbacks.failure))
    }
    zip<U>(result: Async<IResult<U, E>>): IAsyncResult<[T, U], E>
    zip<U>(factory: (value: T) => Async<IResult<U, E>>): IAsyncResult<[T, U], E>
    zip<U>(firstArg: Async<IResult<U, E>> | ((value: T) => Async<IResult<U, E>>)): IAsyncResult<[T, U], E> {
        return this.bind(value => {
            if (typeof firstArg === 'function') firstArg = firstArg(value)

            return callAsync(firstArg, result => result.map(otherValue => [value, otherValue]))
        })
    }
    or<U>(factory: (error: E) => Async<U>): Promise<T | U> {
        return this.then(result => result.isSucceeded
            ? result.value
            : factory(result.error))
    }
    get(errorFactory: (error: E) => Error): Promise<T> {
        return this.then(result => result.isSucceeded
            ? result.value
            : Promise.reject(errorFactory(result.error)))
    }
    toOption(): IAsyncOption<T> {
        return new AsyncOptionImpl(this.then(result => result.toOption()), this._callbacks)
    }
    then<R1 = IResult<T, E>, R2 = never>(onResolved?: (value: IResult<T, E>) => R1 | PromiseLike<R1>, onRejected?: (reason: any) => R2 | PromiseLike<R2>): Promise<R1 | R2> {
        return this._promise.then(onResolved, onRejected)
    }
    catch<R = never>(onRejected?: (reason: any) => R | PromiseLike<R>): Promise<IResult<T, E> | R> {
        return this._promise.catch(onRejected)
    }
    finally(callback?: () => void): Promise<IResult<T, E>> {
        return this._promise.finally(callback)
    }
}
export type AsyncMonadCallbacks = Readonly<{
    some: <T>(value: T) => IOption<T>
    success: <T>(value: T) => IResult<T, never>
    failure: <E>(error: E) => IResult<never, E>
}>
