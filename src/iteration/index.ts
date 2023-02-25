import { Result, ResultLike, Option, OptionLike, Success, Failure, NONE, Some } from '..'
import * as Signals from './signals'

/** @since v2.0.0 */
export type InterruptSignal = 'break' | 'abort'
/**
 * - `'continue'` - keeps the loop going
 * - `'break'` - interrupts the loop and makes the iterating function succeed
 * - `'abort'` - interrupts the loop and makes the iterating funciton fail
 * @since v2.0.0
 */
export type Signal = 'continue' | InterruptSignal
/** @since v2.0.0 */
export type LoopResult<T> =
    | ResultLike<T, InterruptSignal>
    | OptionLike<T>
    | InterruptSignal
/** @since v2.0.0 */
export type VoidResult = LoopResult<any> | Signal | boolean | void

const SIGNAL_MAP: Readonly<Record<InterruptSignal, Result<never, InterruptSignal>>> = {
    'break': Signals.BREAK,
    'abort': Signals.ABORT
}

/**
 * @returns Result depends on the type of the {@link result}:
 * - {@link Result} - returns the {@link result} as-is;
 * - {@link Option} - if the {@link result} has a value, returns the value; otherwise returns {@link Signals.ABORT};
 * - {@link InterruptSignal} - returns a corresponding constant from the {@link Signals} namespace.
 * @since v2.0.0
 */
export function normalizeLoopResult<T>(result: LoopResult<T>): Result<T, InterruptSignal> {
    return typeof result === 'string'
        ? SIGNAL_MAP[result]
        : 'hasValue' in result
            ? result.hasValue
                ? new Success(result.value)
                : Signals.ABORT
            : result.isSucceeded
                ? new Success(result.value)
                : new Failure(result.error)
}
/**
 * @returns Result depends on the type of the {@link result}:
 * - {@link Result} - if the {@link result} is succeeded, returns `'continue'`; otherwise returns the error;
 * - {@link Option} - if the {@link result} has a value, returns `'continue'`; otherwise returns `'abort'`;
 * - {@link Signal} - returns the {@link result} as-is;
 * - `boolean` - if the {@link result} is `true`, returns `'continue'`; otherwise returns `'abort'`;
 * - `void` - returns `'continue'`
 * @since v2.0.0
 */
export function normalizeVoidResult(result: VoidResult): Signal {
    return typeof result === 'undefined'
        ? 'continue'
        : typeof result === 'string'
            ? result
            : typeof result === 'boolean'
                ? result
                    ? 'continue'
                    : 'abort'
                : 'hasValue' in result
                    ? result.hasValue
                        ? 'continue'
                        : 'abort'
                    : result.isSucceeded
                        ? 'continue'
                        : result.error
}

/** @since v2.0.0 */
export function array<T>(length: number | null, callback: (index: number) => LoopResult<T>): Option<T[]>
/** @since v2.0.0 */
export function array<T>(callback: (index: number) => LoopResult<T>): Option<T[]>
export function array<T>(): Option<T[]> {
    const length: number | null = typeof arguments[0] === 'number' || arguments[0] === null
        ? arguments[0]
        : null
    const callback: (index: number) => LoopResult<T> = typeof arguments[1] === 'undefined'
        ? arguments[0]
        : arguments[1]
    const array = length === null ? [] : new Array<T>(length)
    let isAborted = false

    for (let i = 0; length === null || i < length; i++) {
        const iterationResult = normalizeLoopResult(callback(i))

        if (!iterationResult.isSucceeded) {
            isAborted = iterationResult.error === 'abort'
            array.length = i

            break
        }

        array[i] = iterationResult.value
    }

    return isAborted ? NONE : new Some(array)
}
/** @since v2.0.0 */
export function forEach<T>(
    items: Iterable<T>,
    callback: (item: T, index: number) => VoidResult
): Option<number> {
    let index = 0
    let isAborted = false

    for (const item of items) {
        const iterationResult = normalizeVoidResult(callback(item, index++))

        if (iterationResult !== 'continue') {
            isAborted = iterationResult === 'abort'

            break
        }
    }

    return isAborted ? NONE : new Some(index)
}
/** @since v2.0.0 */
export function map<T, U>(
    source: Iterable<T>,
    mapper: (item: T, index: number) => LoopResult<U>
): Option<U[]> {
    return new Some<U[]>([])
        .bind(mapped => forEach(source, (item, index): VoidResult => {
            const iterationResult = normalizeLoopResult(mapper(item, index))

            if (!iterationResult.isSucceeded) return iterationResult

            mapped.push(iterationResult.value)
        }).map(() => mapped))
}