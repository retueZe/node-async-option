import { AsyncSome } from './AsyncSome'

describe('AsyncSome', () => {
    const value = {}
    const option = new AsyncSome(value)

    it('value', async () => {
        const actualValue = await option.value

        expect(actualValue).toBe(value)
    })
})
