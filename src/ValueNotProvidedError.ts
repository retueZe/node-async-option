/** @since v1.0.0 */
export class ValueNotProvidedError extends Error {
    /** @since v1.0.0 */
    static readonly DEFAULT_MESSAGE = 'Value not provided.'

    /** @since v1.0.0 */
    constructor(message?: string) {
        super(message ?? ValueNotProvidedError.DEFAULT_MESSAGE)
        this.name = ValueNotProvidedError.name
    }
}
