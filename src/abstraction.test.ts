import { Async, callAsync, isPromise, promisify } from './abstraction'

let async: Async<number>

describe('isPromise', () => {
    let value: unknown

    it('value is promise', () => {
        value = new Promise(() => {})
        expect(isPromise(value)).toBe(true)
    })
    it('value has \'then\' property', () => {
        value = {then: null}
        expect(isPromise(value)).toBe(true)
    })
    it('value doesn\'t have \'then\' property', () => {
        value = {}
        expect(isPromise(value)).toBe(false)
    })
    it('value is function', () => {
        value = () => {}
        expect(isPromise(value)).toBe(false)
    })
    it('value is function with \'then\' property', () => {
        value = () => {}
        (value as any).then = 123
        expect(isPromise(value)).toBe(true)
    })
    it('value is not object or function', () => {
        value = 123
        expect(isPromise(value)).toBe(false)
    })
})
describe('callAsync', () => {
    let callback: jest.Mock<Async<string>, [number]>
    let expectedResult: string

    beforeEach(() => {
        callback = jest.fn(value => expectedResult = value.toString())
    })
    it('async is promise', async () => {
        const expectedValue = 123
        async = Promise.resolve(expectedValue)
        const resultPromise = callAsync(async, callback)
        expect(isPromise(resultPromise)).toBe(true)
        const result = await resultPromise
        expect(callback).toHaveBeenCalledWith(expectedValue)
        expect(result).toBe(expectedResult)
    })
    it('async is not promise', () => {
        async = 123
        const result = callAsync(async, callback)
        expect(callback).toHaveBeenCalledWith(async)
        expect(result).toBe(expectedResult)
    })
})
describe('promisify', () => {
    it('async is promise', () => {
        async = Promise.resolve(123)
        const promisifiedAsync = promisify(async)
        expect(promisifiedAsync).toBe(async)
    })
    it('async is not promise', async () => {
        async = 123
        const promise = promisify(async)
        expect(isPromise(promise)).toBe(true)
        const promiseResult = await promise
        expect(promiseResult).toBe(async)
    })
})
