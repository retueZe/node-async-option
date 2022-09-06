import { ValueNotProvidedError } from './ValueNotProvidedError'
import { StringGenerator } from 'value-generator'

describe('ValueNotProvidedError', ()=> {
    let message: string | undefined
    let expectedMessage: string
    let error: ValueNotProvidedError

    afterEach(() => {
        error = new ValueNotProvidedError(message)
        expect(error.name).toBe(ValueNotProvidedError.name)
        expect(error.message).toBe(expectedMessage)
    })
    it('message is string', () => {
        message = expectedMessage = StringGenerator.DEFAULT.next()
    })
    it('message is undefined', () => {
        expectedMessage = ValueNotProvidedError.DEFAULT_MESSAGE
        message = undefined
    })
})
