import { Option, Some } from '..'

/** @since v2.0.0 */
export const FLOAT_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i

/** @since v2.0.0 */
export function float(input: string): Option<number> {
    return new Some(input)
        .filter(input => FLOAT_PATTERN.test(input))
        .map(input => Number.parseFloat(input))
}
