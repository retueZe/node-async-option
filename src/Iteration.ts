import { IOption, IResult } from './abstraction'
import { Option } from './Option'
import { Result } from './Result'

const _Result = Result

/** @since v1.8.0 */
export namespace Iteration {
    /**
     * @see {@link Signal}
     * @since v1.8.0
     */
    export type InterruptSignal = 'break' | 'abort'
    /**
     * - `'continue'` - keeps the loop going
     * - `'break'` - interrupts the loop and makes the iterating function succeed
     * - `'abort'` - interrupts the loop and makes the iterating funciton fail
     * @since v1.8.0
     */
    export type Signal = 'continue' | InterruptSignal
    /**
     * @see {@link normalizeResult}
     * @since v1.8.0
     */
    export type Result<T> =
        | IResult<T, InterruptSignal>
        | IOption<T>
        | InterruptSignal
    /**
     * @see {@link normalizeVoidResult}
     * @since v1.8.0
     */
    export type VoidResult = Result<any> | Signal | void
    /** @since v1.8.0 */
    export namespace Signals {
        export const BREAK = _Result.failure<'break'>('break')
        export const ABORT = _Result.failure<'abort'>('abort')
    }

    const SIGNAL_MAP: Readonly<Record<InterruptSignal, IResult<never, InterruptSignal>>> = {
        'break': Signals.BREAK,
        'abort': Signals.ABORT
    }

    /**
     * @returns Result depends on the type of the {@link result}:
     * - {@link IResult} - returns the {@link result} as-is;
     * - {@link IOption} - if the {@link result} has a value, returns the value; otherwise returns {@link Signals.ABORT};
     * - {@link InterruptSignal} - returns a corresponding constant from the {@link Signals} namespace.
     * @since v1.8.0
     */
    export function normalizeResult<T>(result: Result<T>): IResult<T, InterruptSignal> {
        return typeof result === 'string'
            ? SIGNAL_MAP[result]
            : 'hasValue' in result
                ? result.hasValue
                    ? Result.success(result.value)
                    : Signals.ABORT
                : result
    }
    /**
     * @returns Result depends on the type of the {@link result}:
     * - {@link IResult} - if the {@link result} is succeeded, returns `'continue'`; otherwise returns the error
     * - {@link IOption} - if the {@link result} has a value, returns `'continue'`; otherwise returns `'abort'`
     * - {@link Signal} - returns the {@link result} as-is
     * - `void` - returns `'continue'`
     * @since v1.8.0
     */
    export function normalizeVoidResult(result: VoidResult): Signal {
        return typeof result === 'undefined'
            ? 'continue'
            : typeof result === 'string'
                ? result
                : 'hasValue' in result
                    ? result.hasValue
                        ? 'continue'
                        : 'abort'
                    : result.isSucceeded
                        ? 'continue'
                        : result.error
    }

    /** @since v1.8.0 */
    export function array<T>(length: number | null, callback: (index: number) => Result<T>): IOption<T[]>
    /** @since v1.8.0 */
    export function array<T>(callback: (index: number) => Result<T>): IOption<T[]>
    export function array<T>(): IOption<T[]> {
        const length: number | null = typeof arguments[0] === 'number' || arguments[0] === null
            ? arguments[0]
            : null
        const callback: (index: number) => Result<T> = typeof arguments[1] === 'undefined'
            ? arguments[0]
            : arguments[1]
        const array = length === null ? [] : new Array<T>(length)
        let isAborted = false

        for (let i = 0; length === null || i < length; i++) {
            const iterationResult = normalizeResult(callback(i))

            if (!iterationResult.isSucceeded) {
                isAborted = iterationResult.error === 'abort'
                array.length = i

                break
            }

            array[i] = iterationResult.value
        }

        return isAborted ? Option.NONE : Option.some(array)
    }
    /** @since v1.8.0 */
    export function forEach<T>(
        items: Iterable<T>,
        callback: (item: T, index: number) => VoidResult
    ): IOption<number> {
        let index = 0
        let isAborted = false

        for (const item of items) {
            const iterationResult = normalizeVoidResult(callback(item, index++))

            if (iterationResult !== 'continue') {
                isAborted = iterationResult === 'abort'

                break
            }
        }

        return isAborted ? Option.NONE : Option.some(index)
    }
    /** @since v1.8.0 */
    export function map<T, U>(
        source: Iterable<T>,
        mapper: (item: T, index: number) => Result<U>
    ): IOption<U[]> {
        return Option.some<U[]>([])
            .bind(mapped => forEach(source, (item, index) => {
                const iterationResult = normalizeResult(mapper(item, index))

                if (!iterationResult.isSucceeded) return iterationResult

                mapped.push(iterationResult.value)
            })
            .map(() => mapped))
    }
}
