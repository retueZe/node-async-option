import { None, Some, NONE, Option } from '../..'

/** @since v2.0.0 */
export type OptionMap<T> = {
    [K in keyof T]: Option<T[K]> | (() => Option<T[K]>)
}
type FromResult<T> = T extends unknown
    ? unknown extends T
        ? Option<T>
        : T extends undefined
            ? None
            : Some<T>
    : T extends undefined
        ? None
        : Some<T>

/** @since v2.0.0 */
export function from<T>(value: T): FromResult<T> {
    // TSC is not smart enough to pass this without `as any`
    return typeof value === 'undefined'
        ? NONE as any
        : new Some(value)
}
/** @since v2.0.0 */
export function handle<T>(factory: () => T): Option<T> {
    try {
        return new Some(factory())
    } catch {
        return NONE
    }
}
/** @since v2.0.0 */
export function all<T>(options: Iterable<Option<T>>): Option<T[]> {
    const values: T[] = []

    for (const option of options)
        if (option.hasValue)
            values.push(option.value)
        else
            return NONE

    return new Some(values)
}
/** @since v2.0.0 */
export function any<T>(options: Iterable<Option<T>>): Option<T> {
    for (const option of options)
        if (option.hasValue)
            return option

    return NONE
}
/** @since v2.0.0 */
export function extract<T>(map: OptionMap<T>): Option<T> {
    const object: Record<PropertyKey, unknown> = {}

    for (const key in map) {
        const option: Option<any> = typeof map[key] === 'function'
            ? (map[key] as any)()
            : map[key]

        if (option.hasValue)
            object[key] = option.value
        else
            return NONE
    }

    return new Some(object as T)
}

/** @since v2.0.0 */
export const EMPTY = new Some<unknown>(undefined)
