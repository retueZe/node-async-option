/** @since v0.1.0 */
export class ValueNotProvidedError extends Error {
    /** @since v0.1.0 */
    static readonly DEFAULT_MESSAGE = 'Value not provided.'

    /** @since v0.1.0 */
    constructor(message?: string) {
        super(message ?? ValueNotProvidedError.DEFAULT_MESSAGE)
        this.name = ValueNotProvidedError.name
    }
}
