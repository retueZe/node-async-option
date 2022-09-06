import { Async, callAsync, IAsyncOption, IOption, promisify } from './abstraction'
import { Option } from './Option'
import { AsyncOptionImpl } from './private/async'
import { ASYNC_MONAD_CALLBACKS, ASYNC_NONE } from './private/sync'

export namespace AsyncOption {
    export const NONE = ASYNC_NONE

    function async<T, U>(value: Async<T>, callback: (value: T) => IOption<U>): IAsyncOption<U> {
        return new AsyncOptionImpl(promisify(callAsync(value, callback)), ASYNC_MONAD_CALLBACKS)
    }
    export function some<T>(value: Async<T>): IAsyncOption<T> {
        return async(value, Option.some)
    }
    export function option<T>(value: Async<T | undefined>): IAsyncOption<T> {
        return async(value, Option.option)
    }
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
}
export type AsyncOptionMap<T> = {
    readonly [K in keyof T]: Async<IOption<T>>
}
