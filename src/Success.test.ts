import { Failure, Success, Some, NONE, ValueNotProvidedError } from '.'

describe('Success', () => {
    const value = {}
    const instance = new Success(value)

    it('value', () => {
        expect(instance.value).toBe(value)
    })
    it('error', () => {
        expect(() => instance.error).toThrow(ValueNotProvidedError)
    })
    it('isSucceeded', () => {
        instance.isSucceeded
    })
    it('measured', () => {
        expect(instance.measured).toBe(value)
    })
    it('onSuccess', () => {
        const callback = jest.fn()

        instance.onSuccess(callback)

        expect(callback).toBeCalledWith(value)
        expect(callback).toBeCalledTimes(1)
    })
    it('onFailure', () => {
        instance.onFailure()
    })
    it('onBoth', () => {
        const callback = jest.fn()

        instance.onBoth(callback)

        expect(callback).toBeCalledWith(value)
        expect(callback).toBeCalledTimes(1)
    })
    it('swap', () => {
        const swapped = instance.swap()

        expect(swapped.error).toBe(instance.value)
    })
    it('bind', () => {
        const expectedBound = new Failure({})
        const binder = jest.fn(() => expectedBound)

        const bound = instance.bind(binder)

        expect(binder).toBeCalledWith(value)
        expect(binder).toBeCalledTimes(1)
        expect(bound).toBe(expectedBound)
    })
    it('bindError', () => {
        instance.bindError()
    })
    it('map', () => {
        const mappedValue = {}
        const mapper = jest.fn(() => mappedValue)

        const mapped = instance.map(mapper)

        expect(mapper).toBeCalledWith(value)
        expect(mapper).toBeCalledTimes(1)
        expect(mapped.value).toBe(mappedValue)
    })
    it('mapError', () => {
        instance.mapError()
    })
    it('or', () => {
        instance.or()
    })
    it('elseIf', () => {
        instance.elseIf()
    })
    it('else', () => {
        instance.else()
    })
    it.each([new Some({}), NONE])('filter', (expectedCondtionResult) => {
        const condition = jest.fn(() => expectedCondtionResult)

        const filtered = instance.filter(condition)

        expect(condition).toBeCalledWith(value)
        expect(condition).toBeCalledTimes(1)
        expect(filtered.isSucceeded).toBe(!expectedCondtionResult.hasValue)

        if (filtered.isSucceeded)
            expect(filtered).toBe(instance)
        else
            expect(filtered.error).toBe(expectedCondtionResult.value)
    })
    it('filterError', () => {
        instance.filterError()
    })
    it('get', () => {
        const gottenValue = instance.get()

        expect(gottenValue).toBe(value)
    })
    it('getError', () => {
        const error = new Error()
        const factory = jest.fn(() => error)

        expect(() => instance.getError(factory)).toThrow(error)
        expect(factory).toBeCalledWith(value)
        expect(factory).toBeCalledTimes(1)
    })
    it('toOption', () => {
        const option = instance.toOption()

        expect(option.value).toBe(value)
    })
    it('toAsync', async () => {
        const actualValue = await instance.toAsync().value

        expect(actualValue).toBe(value)
    })
})
