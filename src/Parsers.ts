import { IOption } from './abstraction'
import { Option } from './Option'

export const FLOAT_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i
export const INTEGER_PATTERN = /^[+-]?\d+$/

/** @since v1.3.0 */
export namespace Parsers {
    /** @since v1.3.0 */
    export function float(input: string): IOption<number> {
        return Option.some(input)
            .assert(input => FLOAT_PATTERN.test(input))
            .map(parseFloat)
    }
    /** @since v1.3.0 */
    export function integer(input: string): IOption<number> {
        return Option.some(input)
            .assert(input => INTEGER_PATTERN.test(input))
            .map(parseInt)
    }
}
