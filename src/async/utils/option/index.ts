import { Option, Some, NONE } from '../../..'
import { Async, AsyncOption, ASYNC_NONE, AsyncSome } from '../..'
import { isPromise } from '../Promise'

/** @since v2.0.0 */
export type AsyncOptionMap<T> = {
    [K in keyof T]: Async<Option<T[K]>> | (() => Async<Option<T[K]>>)
}

/** @since v2.0.0 */
export function from<T>(value: Async<T | undefined>): AsyncOption<T> {
    // TSC is not smart enough to pass this without `as any`
    return typeof value === 'undefined'
        ? ASYNC_NONE as any
        : new AsyncSome(value)
}
/** @since v2.0.0 */
export function handle<T>(factory: () => Async<T>): AsyncOption<T> {
    let factoryResult: Async<T>

    try {
        factoryResult = factory()
    } catch {
        return ASYNC_NONE
    }

    if (!isPromise(factoryResult)) return new AsyncSome(factoryResult)

    return new AsyncOption(factoryResult
        .then(value => new Some(value), () => NONE))
}
/** @since v2.0.0 */
export function all<T>(_options: Iterable<Async<Option<T>>>): AsyncOption<T[]> {
    const options: Async<Option<T>>[] = Array.isArray(_options) ? _options : [..._options]
    let resultReceived = false
    let waiterCount = 0
    let resultReceiver: ((option: Option<T[]>) => void) | null = null
    const values = new Array<T>(options.length)
    let i = 0

    for (const option of options) {
        const index = i++

        if (isPromise(option)) {
            option.then(option => {
                if (resultReceived) return

                waiterCount--

                if (!option.hasValue) {
                    resultReceived = true

                    if (resultReceiver !== null) resultReceiver(NONE)
                } else {
                    values[index] = option.value

                    if (waiterCount < 0.5 && resultReceiver !== null)
                        resultReceiver(new Some(values))
                }
            })
            waiterCount++
        } else {
            if (!option.hasValue) {
                resultReceived = true

                return ASYNC_NONE
            }

            values[index] = option.value
        }
    }

    return waiterCount < 0.5
        ? new AsyncSome(values)
        : new AsyncOption(new Promise(resolve => resultReceiver = resolve))
}
/** @since v2.0.0 */
export function any<T>(options: Iterable<Async<Option<T>>>): AsyncOption<T> {
    let resultReceived = false
    let waiterCount = 0
    let resultReceiver: ((option: Option<T>) => void) | null = null

    for (const option of options)
        if (isPromise(option)) {
            option.then(option => {
                if (resultReceived) return

                waiterCount--

                if (option.hasValue) {
                    resultReceived = true

                    if (resultReceiver !== null) resultReceiver(option)
                } else if (waiterCount < 0.5 && resultReceiver !== null)
                    resultReceiver(NONE)
            })
            waiterCount++
        } else {
            if (option.hasValue) {
                resultReceived = true

                return option.toAsync()
            }
        }

    return waiterCount < 0.5
        ? ASYNC_NONE
        : new AsyncOption(new Promise(resolve => resultReceiver = resolve))
}
/** @since v2.0.0 */
export function extract<T>(map: AsyncOptionMap<T>): AsyncOption<T> {
    let failed = false
    let waiterCount = 0
    let onCompleted: (() => void) | null = null
    const object: Record<PropertyKey, unknown> = {}

    for (const key in map) {
        const option: Async<Option<any>> = typeof map[key] === 'function'
            ? (map[key] as any)()
            : map[key]

        if (isPromise(option)) {
            option.then(option => {
                if (failed) return
                if (option.hasValue) {
                    object[key] = option.value

                    waiterCount--

                    if (waiterCount < 0.5 && onCompleted !== null) onCompleted()
                } else {
                    failed = true

                    if (onCompleted !== null) onCompleted()
                }
            })
            waiterCount++
        } else {
            if (option.hasValue)
                object[key] = option.value
            else {
                failed = true

                return ASYNC_NONE
            }
        }
    }

    return waiterCount < 0.5
        ? new AsyncSome(object as T)
        : new AsyncOption(new Promise(resolve => onCompleted = () => failed
            ? resolve(new Some(object as T))
            : resolve(NONE)))
}

/** @since v2.0.0 */
export const EMPTY = new AsyncSome<unknown>(undefined)
