import { Some, NONE, ValueNotProvidedError, Option } from '..'
import { AsyncOption, AsyncElseIfCondition } from '.'

describe('AsyncOption', () => {
    describe.each([false, true])('some', isOptionAsync => {
        const value = {}
        const option = new Some(value)
        const instance = new AsyncOption(isOptionAsync
            ? Promise.resolve(option)
            : option)

        it('value', async () => {
            const actualValue = await instance.value

            expect(actualValue).toBe(value)
        })
        it('hasValue', async () => {
            const hasValue = await instance.hasValue

            expect(hasValue).toBe(true)
        })
        it('measured', async () => {
            const measured = await instance.measured

            expect(measured).toBe(value)
        })
        it.each([undefined, Promise.resolve()])('onSome', async output => {
            const callback = jest.fn(() => output)

            const actualOption = await instance.onSome(callback)

            expect(callback).toBeCalledWith(value)
            expect(callback).toBeCalledTimes(1)
            expect(actualOption).toBe(option)
        })
        it('onNone', async () => {
            const callback = jest.fn()

            const actualOption = await instance.onNone(callback)

            expect(callback).not.toBeCalled()
            expect(actualOption).toBe(option)
        })
        it.each([undefined, Promise.resolve()])('onBoth', async output => {
            const callback = jest.fn(() => output)

            const actualOption = await instance.onBoth(callback)

            expect(callback).toBeCalledWith(value)
            expect(callback).toBeCalledTimes(1)
            expect(actualOption).toBe(option)
        })
        it.each([false, true])('bind', async isAsync => {
            const expectedBound = new Some({})
            const binder = jest.fn(() => isAsync
                ? Promise.resolve(expectedBound)
                : expectedBound)

            const bound = await instance.bind(binder)

            expect(binder).toBeCalledWith(value)
            expect(binder).toBeCalledTimes(1)
            expect(bound).toBe(expectedBound)
        })
        it.each([false, true])('map', async isAsync => {
            const expectedMappedValue = {}
            const mapper = jest.fn(() => isAsync
                ? Promise.resolve(expectedMappedValue)
                : expectedMappedValue)

            const mappedValue = await instance.map(mapper).value

            expect(mapper).toBeCalledWith(value)
            expect(mapper).toBeCalledTimes(1)
            expect(mappedValue).toBe(expectedMappedValue)
        })
        it('wrapInside', async () => {
            const wrapped = await instance.wrapInside()

            expect(wrapped.value).toBe(option)
        })
        it('wrapOutside', async () => {
            const wrapped = await instance.wrapOutside()

            expect(wrapped.value).toBe(option)
        })
        it('or', async () => {
            const factory = jest.fn()

            const actualOption = await instance.or(factory)

            expect(factory).not.toBeCalled()
            expect(actualOption).toBe(option)
        })
        it('elseIf', async() => {
            const condition = jest.fn()
            const factory = jest.fn()

            const actualOption = await instance.elseIf(condition, factory)

            expect(condition).not.toBeCalled()
            expect(factory).not.toBeCalled()
            expect(actualOption).toBe(option)
        })
        it('else', async () => {
            const factory = jest.fn()

            const actualOption = await instance.else(factory)

            expect(factory).not.toBeCalled()
            expect(actualOption).toBe(option)
        })
        it.each([
            [false, false],
            [true, false],
            [false, true],
            [true, true]
        ])('filter', async (isAsync, conditionResult) => {
            const condition = jest.fn(() => isAsync
                ? Promise.resolve(conditionResult)
                : conditionResult)

            const actualOption = await instance.filter(condition)

            expect(condition).toBeCalledWith(value)
            expect(condition).toBeCalledTimes(1)

            if (conditionResult)
                expect(actualOption).toBe(option)
            else
                expect(actualOption.hasValue).toBe(false)
        })
        it('get', async () => {
            const errorFactory = jest.fn()

            const actualValue = await instance.get(errorFactory)

            expect(errorFactory).not.toBeCalled()
            expect(actualValue).toBe(value)
        })
        it('toResult', async () => {
            const errorFactory = jest.fn()

            const actualValue = await instance.toResult(errorFactory).value

            expect(errorFactory).not.toBeCalled()
            expect(actualValue).toBe(value)
        })
    })
    describe.each([false, true])('none', isOptionAsync => {
        const option = NONE
        const instance = new AsyncOption<never>(isOptionAsync
            ? Promise.resolve(option)
            : option)

        it('value', async () => {
            try {
                await instance.value

                expect(false).toBe(true)
            } catch(error) {
                expect(error).toBeInstanceOf(ValueNotProvidedError)
            }
        })
        it('hasValue', async () => {
            const hasValue = await instance.hasValue

            expect(hasValue).toBe(false)
        })
        it('measured', async () => {
            const measured = await instance.measured

            expect(measured).toBeUndefined()
        })
        it('onSome', async () => {
            const callback = jest.fn()

            const actualOption = await instance.onSome(callback)

            expect(callback).not.toBeCalled()
            expect(actualOption).toBe(option)
        })
        it.each([undefined, Promise.resolve()])('onNone', async output => {
            const callback = jest.fn(() => output)

            const actualOption = await instance.onNone(callback)

            expect(callback).toBeCalledWith()
            expect(callback).toBeCalledTimes(1)
            expect(actualOption).toBe(option)
        })
        it.each([undefined, Promise.resolve()])('onBoth', async output => {
            const callback = jest.fn(() => output)

            const actualOption = await instance.onBoth(callback)

            expect(callback).toBeCalledWith(undefined)
            expect(callback).toBeCalledTimes(1)
            expect(actualOption).toBe(option)
        })
        it('bind', async () => {
            const binder = jest.fn()

            const actualOption = await instance.bind(binder)

            expect(binder).not.toBeCalled()
            expect(actualOption).toBe(option)
        })
        it('map', async () => {
            const mapper = jest.fn()

            const actualOption = await instance.map(mapper)

            expect(mapper).not.toBeCalled()
            expect(actualOption).toBe(option)
        })
        it('wrapInside', async () => {
            const wrapped = await instance.wrapInside()

            expect(wrapped).toBe(option)
        })
        it('wrapOutside', async () => {
            const wrapped = await instance.wrapOutside()

            expect(wrapped.value).toBe(option)
        })
        it.each([false, true])('or', async isAsync => {
            const expectedOption = new Some({})
            const factory = jest.fn(() => isAsync
                ? Promise.resolve(expectedOption)
                : expectedOption)

            const actualOption = await instance.or(factory)

            expect(factory).toBeCalledWith()
            expect(factory).toBeCalledTimes(1)
            expect(actualOption).toBe(expectedOption)
        })
        it.each<[AsyncElseIfCondition, number, Option<Record<string, never>>]>([
            [[], 0, new Some({})],
            [() => true, 0, new Some({})],
            [[() => true, () => true], 2, new Some({})],
            [() => false, 0, NONE],
            [[() => false, () => true], 1, NONE],
            [() => Promise.resolve(true), 0, new Some({})],
            [[() => Promise.resolve(true), () => Promise.resolve(true)], 2, new Some({})],
            [() => Promise.resolve(false), 0, NONE],
            [[() => false, () => Promise.resolve(true)], 1, NONE]
        ])('elseIf', async (condition, conditionsCalled, expectedElseIfResult) => {
            const mockedCondition = typeof condition === 'function'
                ? jest.fn(condition)
                : [...condition].map(subcondition => jest.fn(subcondition))
            const factory = jest.fn(() => {
                expect(expectedElseIfResult.hasValue).toBe(true)

                return expectedElseIfResult.value
            })

            const elseIfResult = await instance.elseIf(mockedCondition, factory)

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
                expect(elseIfResult).toBe(option)
        })
        it.each([false, true])('else', async isAsync => {
            const expectedValue = {}
            const factory = jest.fn(() => isAsync
                ? Promise.resolve(expectedValue)
                : expectedValue)

            const actualValue = await instance.else(factory).value

            expect(factory).toBeCalledWith()
            expect(factory).toBeCalledTimes(1)
            expect(actualValue).toBe(expectedValue)
        })
        it('filter', async () => {
            const condition = jest.fn()

            const actualOption = await instance.filter(condition)

            expect(condition).not.toBeCalled()
            expect(actualOption).toBe(option)
        })
        it.each([false, true])('get', async isAsync => {
            const error = new Error()
            const errorFactory = jest.fn(() => isAsync
                ? Promise.resolve(error)
                : error)

            try {
                await instance.get(errorFactory)

                expect(false).toBe(true)
            } catch(actualError) {
                expect(errorFactory).toBeCalledWith()
                expect(errorFactory).toBeCalledTimes(1)
                expect(actualError).toBe(error)
            }
        })
        it.each([false, true])('toResult', async isAsync => {
            const error = {}
            const errorFactory = jest.fn(() => isAsync
                ? Promise.resolve(error)
                : error)

            const actualError = await instance.toResult(errorFactory).error

            expect(errorFactory).toBeCalledWith()
            expect(errorFactory).toBeCalledTimes(1)
            expect(actualError).toBe(error)
        })
    })
    describe('Promise', () => {
        it('[Symbol.toStringTag]', () => {
            expect(AsyncOption.prototype[Symbol.toStringTag]).toBe(AsyncOption.name)
        })
        describe.each([false, true])('then/catch/finally', rejected => {
            const option = new Some({})
            const instance = new AsyncOption(rejected
                ? Promise.reject(option)
                : Promise.resolve(option))

            it('then', () => {
                const onResolved = jest.fn()
                const onRejected = jest.fn()

                return instance
                    .then(onResolved, onRejected)
                    .finally(() => {
                        if (rejected) {
                            expect(onResolved).not.toBeCalled()
                            expect(onRejected).toBeCalledWith(option)
                            expect(onRejected).toBeCalledTimes(1)
                        } else {
                            expect(onResolved).toBeCalledWith(option)
                            expect(onResolved).toBeCalledTimes(1)
                            expect(onRejected).not.toBeCalled()

                        }
                    })
            })
            it('catch', () => {
                const onRejected = jest.fn()

                return instance
                    .catch(onRejected)
                    .finally(() => {
                        if (rejected) {
                            expect(onRejected).toBeCalledWith(option)
                            expect(onRejected).toBeCalledTimes(1)
                        } else
                            expect(onRejected).not.toBeCalled()
                    })
            })
            it('finally', () => {
                const callback = jest.fn()

                return instance
                    .finally(callback)
                    .finally(() => {
                        expect(callback).toBeCalledWith()
                        expect(callback).toBeCalledTimes(1)
                    })
                    .catch(error => error === option
                        ? undefined
                        : Promise.reject(error))
            })
        })
    })
})
