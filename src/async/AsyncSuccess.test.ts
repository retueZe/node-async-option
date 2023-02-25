import { AsyncSuccess } from './AsyncSuccess'

describe('AsyncSuccess', () => {
    const value = {}
    const result = new AsyncSuccess(value)

    it('value', async () => {
        const actualValue = await result.value

        expect(actualValue).toBe(value)
    })
})
