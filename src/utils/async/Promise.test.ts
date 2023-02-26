import { isPromise } from 'node:util/types'
import { Async } from '../../async'
import { promisify } from './Promise'

it.each<Async<Record<string, never>>>([{}, Promise.resolve({})])('promisify', async expectedValue => {
    const promise = promisify(expectedValue)

    if (isPromise(expectedValue)) {
        expect(promise).toBe(expectedValue)

        return
    }

    const value = await promise

    expect(value).toBe(expectedValue)
})
