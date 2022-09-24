import { IOption } from './abstraction'
import { NONE as SYNC_NONE, Some } from './private/sync'

/** @since v0.1.0 */
export namespace Option {
    /** @since v0.1.0 */
    export const NONE = SYNC_NONE
    /**
     * @example
     * // this asserts are an analogous to if's at the beginning of functions
     * Option.EMPTY
     *     .assert(...) // precondition #1
     *     .assert(...) // precondition #2
     *     .assert(...) // precondition #3
     *     .bind(...) // computations start here
     * @since v1.8.0
     */
    export const EMPTY = some(undefined)

    /** @since v0.1.0 */
    export function some<T>(value: T): IOption<T> {
        return new Some(value)
    }
    /** @since v0.1.0 */
    export function option<T>(value: T | undefined): IOption<T> {
        return typeof value === 'undefined'
            ? NONE
            : some(value)
    }
    /** @since v0.1.0 */
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
    /** @since v0.1.0 */
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
    /** @since v1.2.0 */
    export function any<T>(options: Iterable<IOption<T>>): IOption<T> {
        for (const option of options)
            if (option.hasValue)
                return option

        return NONE
    }
}
/** @since v0.1.0 */
export type OptionMap<T> = {
    readonly [K in keyof T]: IOption<T[K]>
}
