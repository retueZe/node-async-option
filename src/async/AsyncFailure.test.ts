import { AsyncFailure } from './AsyncFailure'

describe('AsyncFailure', () => {
    const error = {}
    const result = new AsyncFailure(error)

    it('error', async () => {
        const actualError = await result.error

        expect(actualError).toBe(error)
    })
})
