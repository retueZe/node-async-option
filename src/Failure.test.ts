import { Failure, FailureElseIfCondition, Result, Some, NONE, ValueNotProvidedError, Success } from '.'

describe('Failure', () => {
    const error = {}
    const instance = new Failure(error)

    it('value', () => {
        expect(() => instance.value).toThrow(ValueNotProvidedError)
    })
    it('error', () => {
        expect(instance.error).toBe(error)
    })
    it('isSucceeded', () => {
        instance.isSucceeded
    })
    it('measured', () => {
        expect(instance.measured).toBe(error)
    })
    it('onSuccess', () => {
        instance.onSuccess()
    })
    it('onFailure', () => {
        const callback = jest.fn()

        instance.onFailure(callback)

        expect(callback).toBeCalledWith(error)
        expect(callback).toBeCalledTimes(1)
    })
    it('onBoth', () => {
        const callback = jest.fn()

        instance.onBoth(callback)

        expect(callback).toBeCalledWith(error)
        expect(callback).toBeCalledTimes(1)
    })
    it('swap', () => {
        const swapped = instance.swap()

        expect(swapped.value).toBe(error)
    })
    it('bind', () => {
        instance.bind()
    })
    it('bindError', () => {
        const boundValue = new Success({})
        const binder = jest.fn(() => boundValue)

        const bound = instance.bindError(binder)

        expect(binder).toBeCalledWith(error)
        expect(binder).toBeCalledTimes(1)
        expect(bound).toBe(boundValue)
    })
    it('map', () => {
        instance.map()
    })
    it('mapError', () => {
        const mappedError = {}
        const mapper = jest.fn(() => mappedError)

        const mapped = instance.mapError(mapper)

        expect(mapper).toBeCalledWith(error)
        expect(mapper).toBeCalledTimes(1)
        expect(mapped.error).toBe(mappedError)
    })
    it.each<[FailureElseIfCondition, number, Result<Record<string, never>, Record<string, never>>]>([
        [() => true, 0, new Success({})],
        [[() => true, () => true], 2, new Success({})],
        [() => false, 0, new Failure({})],
        [[() => false, () => true], 1, new Failure({})]
    ])('elseIf', (condition, conditionsCalled, expectedElseIfResult) => {
        const mockedCondition = typeof condition === 'function'
            ? jest.fn(condition)
            : [...condition].map(subcondition => jest.fn(subcondition))
        const factory = jest.fn(() => {
            expect(expectedElseIfResult.isSucceeded).toBe(true)

            return expectedElseIfResult.value
        })

        const elseIfResult = instance.elseIf(mockedCondition, factory)

        if (typeof mockedCondition === 'function') {
            expect(mockedCondition).toBeCalledWith(error)
            expect(mockedCondition).toBeCalledTimes(1)
        } else {
            for (let i = 0; i < conditionsCalled - 0.5; i++) {
                expect(mockedCondition[i]).toBeCalledWith(error)
                expect(mockedCondition[i]).toBeCalledTimes(1)
            }
            for (let i = conditionsCalled; i < mockedCondition.length - 0.5; i++)
                expect(mockedCondition[i]).not.toBeCalled()
        }

        expect(elseIfResult.isSucceeded).toBe(expectedElseIfResult.isSucceeded)

        if (expectedElseIfResult.isSucceeded) {
            expect(elseIfResult.value).toBe(expectedElseIfResult.value)
            expect(factory).toBeCalledWith(error)
            expect(factory).toBeCalledTimes(expectedElseIfResult.isSucceeded ? 1 : 0)
        } else
            expect(elseIfResult).toBe(instance)
    })
    it('else', () => {
        const elseValue = {}
        const factory = jest.fn(() => elseValue)

        const elseResult = instance.else(factory)

        expect(factory).toBeCalledWith(error)
        expect(factory).toBeCalledTimes(1)
        expect(elseResult.value).toBe(elseValue)
    })
    it('filter', () => {
        instance.filter()
    })
    it.each([new Some({}), NONE])('filterError', (expectedCondtionResult) => {
        const condition = jest.fn(() => expectedCondtionResult)

        const filtered = instance.filterError(condition)

        expect(condition).toBeCalledWith(error)
        expect(condition).toBeCalledTimes(1)
        expect(filtered.isSucceeded).toBe(expectedCondtionResult.hasValue)

        if (filtered.isSucceeded)
            expect(filtered.value).toBe(expectedCondtionResult.value)
        else
            expect(filtered).toBe(instance)
    })
    it('get', () => {
        const expectedError = new Error()
        const factory = jest.fn(() => expectedError)

        expect(() => instance.get(factory)).toThrow(expectedError)
        expect(factory).toBeCalledWith(error)
        expect(factory).toBeCalledTimes(1)
    })
    it('getError', () => {
        const gottenError = instance.getError()

        expect(gottenError).toBe(error)
    })
    it('demand', () => {
        const expectedError = new Error()
        const factory = jest.fn(() => expectedError)

        expect(() => instance.demand(factory)).toThrow(expectedError)
        expect(factory).toBeCalledWith(error)
        expect(factory).toBeCalledTimes(1)
    })
    it('demandError', () => {
        instance.demandError()
    })
    it('toOption', () => {
        instance.toOption()
    })
    it('toAsync', async () => {
        const actualError = await instance.toAsync().error

        expect(actualError).toBe(error)
    })
})
