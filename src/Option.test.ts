import { Option } from './Option'
import { NONE, Some } from './private/sync'
import { NumberGenerator, PrimitiveValueGenerator } from 'value-generator'

describe('Option', () => {
    it('NONE', () => {
        expect(Option.NONE).toBe(NONE)
    })
    describe('some', () => {
        const expectedValue = PrimitiveValueGenerator.DEFAULT.next()
        const option = Option.some(expectedValue)
        expect(option).toBeInstanceOf(Some)
        expect(option.hasValue).toBe(true)
        expect(option.value).toBe(expectedValue)
    })
    describe('option', () => {
        let value: unknown

        it('input is not undefined', () => {
            value = NumberGenerator.DEFAULT.next()
            const option = Option.option(value)
            expect(option.hasValue).toBe(true)
            expect(option.value).toBe(value)
        })
        it('input is undefined', () => {
            value = undefined
            const option = Option.option(value)
            expect(option.hasValue).toBe(false)
        })
    })
    it.todo('extractArray')
    it.todo('extractObject')
})