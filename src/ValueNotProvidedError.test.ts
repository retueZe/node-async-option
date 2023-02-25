import { ValueNotProvidedError } from './ValueNotProvidedError'

describe.each([
    ['msg', false],
    [null, true],
    [undefined, true]
])('ValueNotProvidedError', (message, shouldMessageBeEqualToDefaultMessage) => {
    const instance = new ValueNotProvidedError(message)

    it('name', () => {
        expect(instance.name).toBe(ValueNotProvidedError.name)
    })
    it('message', () => {
        if (shouldMessageBeEqualToDefaultMessage)
            expect(instance.message).toBe(ValueNotProvidedError.DEFAULT_MESSAGE)
        else
            expect(instance.message).toBe(message)
    })
})
