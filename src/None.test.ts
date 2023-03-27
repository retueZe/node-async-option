import { NONE, Option, Some, ValueNotProvidedError, ElseIfCondition, OptionLike } from '.'

describe('None', () => {
    const instance = NONE

    it('value', () => {
        expect(() => instance.value).toThrow(ValueNotProvidedError)
    })
    it('hasValue', () => {
        instance.hasValue
    })
    it('measured', () => {
        instance.measured
    })
    it('onSome', () => {
        instance.onSome()
    })
    it('onNone', () => {
        const callback = jest.fn()

        instance.onNone(callback)

        expect(callback).toBeCalledWith()
        expect(callback).toBeCalledTimes(1)
    })
    it('onBoth', () => {
        const callback = jest.fn()

        instance.onBoth(callback)

        expect(callback).toBeCalledWith(undefined)
        expect(callback).toBeCalledTimes(1)
    })
    it('bind', () => {
        instance.bind()
    })
    it('map', () => {
        instance.map()
    })
    it('wrapInside', () => {
        instance.wrapInside()
    })
    it('wrapOutside', () => {
        instance.wrapOutside()
    })
    it.each<OptionLike<Record<string, never>>>([
        new Some({}),
        NONE,
        {hasValue: true, value: {}},
        {hasValue: false, get value(): never {
            throw new ValueNotProvidedError()
        }}
    ])('or', (factoryResult) => {
        const factory = jest.fn(() => factoryResult)

        const created = instance.or(factory)

        expect(factory).toBeCalledWith()
        expect(factory).toBeCalledTimes(1)
        expect(created.hasValue).toBe(factoryResult.hasValue)

        if (created.hasValue) expect(created.value).toBe(factoryResult.value)
    })
    it.each<[ElseIfCondition, number, Option<Record<string, never>>]>([
        [[], 0, new Some({})],
        [() => true, 0, new Some({})],
        [[() => true, () => true], 2, new Some({})],
        [() => false, 0, NONE],
        [[() => false, () => true], 1, NONE]
    ])('elseIf', (condition, conditionsCalled, expectedElseIfResult) => {
        const mockedCondition = typeof condition === 'function'
            ? jest.fn(condition)
            : [...condition].map(subcondition => jest.fn(subcondition))
        const factory = jest.fn(() => {
            expect(expectedElseIfResult.hasValue).toBe(true)

            return expectedElseIfResult.value
        })

        const elseIfResult = instance.elseIf(mockedCondition, factory)

        if (typeof mockedCondition === 'function') {
            expect(mockedCondition).toBeCalledWith()
            expect(mockedCondition).toBeCalledTimes(1)
        } else {
            for (let i = 0; i < conditionsCalled - 0.5; i++) {
                expect(mockedCondition[i]).toBeCalledWith()
                expect(mockedCondition[i]).toBeCalledTimes(1)
            }
            for (let i = conditionsCalled; i < mockedCondition.length - 0.5; i++)
                expect(mockedCondition[i]).not.toBeCalled()
        }

        expect(elseIfResult.hasValue).toBe(expectedElseIfResult.hasValue)

        if (expectedElseIfResult.hasValue) {
            expect(elseIfResult.value).toBe(expectedElseIfResult.value)
            expect(factory).toBeCalledWith()
            expect(factory).toBeCalledTimes(expectedElseIfResult.hasValue ? 1 : 0)
        } else
            expect(elseIfResult).toBe(instance)
    })
    it('else', () => {
        const factoryResult = {}
        const factory = jest.fn(() => factoryResult)

        const result = instance.else(factory)

        expect(factory).toBeCalledWith()
        expect(factory).toBeCalledTimes(1)
        expect(result.value).toBe(factoryResult)
    })
    it('filter', () => {
        instance.filter()
    })
    it('get', () => {
        const error = new Error()
        const errorFactory = jest.fn(() => error)

        expect(() => instance.get(errorFactory)).toThrow(error)
        expect(errorFactory).toBeCalledWith()
        expect(errorFactory).toBeCalledTimes(1)
    })
    it('toResult', () => {
        const error = {}
        const errorFactory = jest.fn(() => error)

        const result = instance.toResult(errorFactory)

        expect(errorFactory).toBeCalledWith()
        expect(errorFactory).toBeCalledTimes(1)
        expect(result.error).toBe(error)
    })
    it('toAsync', async () => {
        const result = instance.toAsync()
        const awaited = await result

        expect(awaited).toBe(instance)
    })
})
