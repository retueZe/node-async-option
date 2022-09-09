import { IOption } from './abstraction'
import { NONE as SYNC_NONE, Some } from './private/sync'

export namespace Option {
    export const NONE = SYNC_NONE
    
    export function some<T>(value: T): IOption<T> {
        return new Some(value)
    }
    export function option<T>(value: T | undefined): IOption<T> {
        return typeof value === 'undefined'
            ? NONE
            : some(value)
    }
    export function extractArray<T>(array: readonly IOption<T>[], splice?: boolean, defaultItem?: T): IOption<T[]> {
        splice ??= false
        const extracted: T[] = []

        for (const option of array)
            if (option.hasValue)
                extracted.push(option.value)
            else if (splice) {
                if (typeof defaultItem !== 'undefined')
                    extracted.push(defaultItem)
            } else
                return NONE

        return some(extracted)
    }
    export function extractObject<T>(map: OptionMap<T>, splice?: boolean): IOption<T> {
        splice ??= false
        const extracted = {} as T

        for (const name in map) {
            const option = map[name]

            if (option.hasValue)
                extracted[name] = option.value
            else if (!splice)
                return NONE
        }

        return some(extracted)
    }
    export function any<T>(options: Iterable<IOption<T>>): IOption<T> {
        for (const option of options)
            if (option.hasValue)
                return option

        return NONE
    }
}
export type OptionMap<T> = {
    readonly [K in keyof T]: IOption<T[K]>
}
