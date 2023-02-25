/** @since v2.0.0 */
export class ValueNotProvidedError extends Error {
    /** @since v2.0.0 */
    static readonly DEFAULT_MESSAGE = 'Value not provided.'

    /** @since v2.0.0 */
    constructor(message?: string | null) {
        super(message ?? ValueNotProvidedError.DEFAULT_MESSAGE)
        this.name = ValueNotProvidedError.name
    }
}
