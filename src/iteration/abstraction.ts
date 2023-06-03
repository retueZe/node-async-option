import { Result, ResultLike, OptionLike, Success, Failure } from '..'
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
