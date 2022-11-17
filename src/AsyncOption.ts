import { Async, callAsync, IAsyncOption, IOption, isPromise, promisify } from './abstraction'
import { Option } from './Option'
import { AsyncOptionImpl } from './private/async'
import { ASYNC_MONAD_CALLBACKS, ASYNC_NONE } from './private/sync'

/** @since v0.1.0 */
export namespace AsyncOption {
    /** @since v0.1.0 */
    export const NONE = ASYNC_NONE

    function async<T, U>(value: Async<T>, callback: (value: T) => IOption<U>): IAsyncOption<U> {
        return from(promisify(callAsync(value, callback)))
    }
    /** @since v0.1.0 */
    export function some<T>(value: Async<T>): IAsyncOption<T> {
        return async(value, Option.some)
    }
    /** @since v0.1.0 */
    export function option<T>(value: Async<T | undefined>): IAsyncOption<T> {
        return async(value, Option.option)
    }
    /** @since v0.1.0 */
    export function extractArray<T>(array: readonly Async<IOption<T>>[], splice?: boolean, defaultItem?: Async<T>): IAsyncOption<T[]> {
        splice ??= false
        const extracted = new Array<T | undefined>(array.length)
        let count = 0
        const createCallback = (index: number, resolve: (array: IOption<T[]>) => void) => (option: IOption<T>) => {
            if (!option.hasValue && !splice) resolve(Option.NONE)
            if (splice)
                callAsync(defaultItem, item => extracted[index] = item)
            else
                extracted[index] = option.value

            count++

            if (count + 0.5 > array.length) resolve(Option.some(extracted))
        }
        const promise = new Promise<IOption<T[]>>(resolve => {
            for (let i = 0; i < array.length; i++)
                callAsync(array[i], createCallback(i, resolve))
        })

        return some(promise)
            .bind(option => option)
            .map(array => array.filter(item => typeof item !== 'undefined'))
    }
    /** @since v0.1.0 */
    export function extractObject<T>(map: AsyncOptionMap<T>, splice?: boolean): IAsyncOption<T> {
        splice ??= false
        const extracted = {} as T
        const propertyCount = Object.keys(extracted).length
        let count = 0
        const createCallback = (name: string, resolve: (array: IOption<T>) => void) => (option: IOption<unknown>) => {
            if (!option.hasValue && !splice) resolve(Option.NONE)
            if (!splice) extracted[name] = option.value

            count++

            if (count + 0.5 > propertyCount) resolve(Option.some(extracted))
        }
        const promise = new Promise<IOption<T>>(resolve => {
            for (const name in map)
                callAsync(map[name], createCallback(name, resolve))
        })

        return some(promise)
            .bind(option => option)
    }
    /** @since v1.2.0 */
    export function any<T>(options: Iterable<Async<IOption<T>>>): IAsyncOption<T> {
        const syncOptions: IOption<T>[] = []
        const asyncOptions: Promise<IOption<T>>[] = []

        for (const option of options)
            if (isPromise(option))
                asyncOptions.push(option)
            else
                syncOptions.push(option)

        const syncOption = Option.any(syncOptions)

        if (syncOption.hasValue) return syncOption.toAsync()

        let isResultGotten = false
        let optionsCompleted = 0

        return option(new Promise(resolve => {
            for (const option of asyncOptions)
                option.then(option => {
                    if (isResultGotten) return

                    optionsCompleted++

                    if (option.hasValue) {
                        isResultGotten = true
                        resolve(option.value)
                    }
                    if (optionsCompleted + 0.5 > asyncOptions.length) resolve(undefined)
                })
        }))
    }
    /** @since v1.9.0 */
    export function from<T>(option: Async<IOption<T>>): IAsyncOption<T> {
        return isPromise(option)
            ? new AsyncOptionImpl(option, ASYNC_MONAD_CALLBACKS)
            : option.toAsync()
    }
    /** @since v1.9.0 */
    export function handle<T>(factory: () => Async<T>): IAsyncOption<T> {
        let value: Async<T>

        try { value = factory() } catch { return NONE }

        if (!isPromise(value)) return some(value)

        return from(value.then(
            value => Option.some(value),
            () => Option.NONE))
    }
}
/** @since v0.1.0 */
export type AsyncOptionMap<T> = {
    readonly [K in keyof T]: Async<IOption<T>>
}
