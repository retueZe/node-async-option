import { Option, Some } from '..'

/** @since v2.0.0 */
export const INTEGER_PATTERN = /^[+-]?\d+$/

/** @since v2.0.0 */
export function integer(input: string): Option<number> {
    return new Some(input)
        .filter(input => INTEGER_PATTERN.test(input))
        .map(input => Number.parseFloat(input))
}
