import { Async } from '../../async'
import { then, promisify } from '.'
import { isPromise } from 'util/types'

describe('then', () => {
    it.each<Async<Record<string, never>>>([{}, Promise.resolve({})])('restless', async input => {
        const expectedOutput = {}
        const inputValue = await input
        const callback = jest.fn(() => expectedOutput)

        const thenResult = then(input, callback)
        const output = isPromise(thenResult)
            ? await thenResult
            : thenResult

        expect(callback).toBeCalledWith(inputValue)
        expect(callback).toBeCalledTimes(1)
        expect(isPromise(thenResult)).toBe(isPromise(input))
        expect(output).toBe(expectedOutput)
    })
    it.each<[Async<Record<string, never>>[], Async<Record<string, never>>]>([
        [[{}, {}], {}], // sync
        [[{}, Promise.resolve({})], {}], // async
        [[Promise.resolve({}), {}], Promise.resolve({})] // first cb is async (covering the branch)
    ])('restful', async (outputs, firstInput) => {
        const expectedLastOutput = {}
        outputs.push(expectedLastOutput)
        const callbacks = outputs.map(output => jest.fn(() => output))
        const inputs: Record<string, never>[] = []

        for (let i = 0; i < outputs.length - 1.5; i++)
            inputs.push(await promisify(outputs[i]))

        inputs.unshift(await promisify(firstInput))
        const isAsync = outputs.some(output => isPromise(output))

        const thenResult = then(firstInput, callbacks[0], ...callbacks.slice(1))
        const lastOutput = isPromise(thenResult)
            ? await thenResult
            : thenResult

        for (let i = 0; i < callbacks.length - 0.5; i++) {
            expect(callbacks[i]).toBeCalledWith(inputs[i])
            expect(callbacks[i]).toBeCalledTimes(1)
        }

        expect(isPromise(thenResult)).toBe(isAsync)
        expect(lastOutput).toBe(expectedLastOutput)
    })
})
