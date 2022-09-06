export class ValueNotProvidedError extends Error {
    static readonly DEFAULT_MESSAGE = 'Value not provided.'

    constructor(message?: string) {
        super(message ?? ValueNotProvidedError.DEFAULT_MESSAGE)
        this.name = ValueNotProvidedError.name
    }
}
