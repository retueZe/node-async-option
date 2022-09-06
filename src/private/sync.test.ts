import { IOption, IResult } from '../abstraction'
import { ValueNotProvidedError } from '../ValueNotProvidedError'
import { AsyncOptionImpl } from './async'
import { ASYNC_MONAD_CALLBACKS, ASYNC_NONE, Failure, None, NONE, Some, Success } from './sync'
import { NumberGenerator, PrimitiveValueGenerator, StringGenerator } from 'value-generator'

let inputValue: number
let option: IOption<number>
let result: IResult<number, number>
let mock: jest.Mock
const generateInteger = () => NumberGenerator.DEFAULT.nextInteger(999)
const generateString = () => StringGenerator.DEFAULT.next()

beforeEach(() => {
    mock = jest.fn()
})
describe('ASYNC_MONAD_CALLBACKS', () => {
    it('some', () => {
        const expectedValue = generateInteger()
        option = ASYNC_MONAD_CALLBACKS.some(expectedValue)
        expect(option).toBeInstanceOf(Some)
        expect(option.hasValue).toBe(true)
        expect(option.value).toBe(expectedValue)
    })
    it('success', () => {
        const expectedValue = generateInteger()
        result = ASYNC_MONAD_CALLBACKS.success(expectedValue)
        expect(result).toBeInstanceOf(Success)
        expect(result.isSucceeded).toBe(true)
        expect(result.value).toBe(expectedValue)
    })
    it('success', () => {
        const expectedError = generateInteger()
        result = ASYNC_MONAD_CALLBACKS.failure(expectedError)
        expect(result).toBeInstanceOf(Failure)
        expect(result.isSucceeded).toBe(false)
        expect(result.error).toBe(expectedError)
    })
})
describe('Some', () => {
    beforeEach(() => {
        inputValue = generateInteger()
        option = new Some(inputValue)
    })
    it('value', () => {
        expect(option.value).toBe(inputValue)
    })
    it('hasValue', () => {
        expect(option.hasValue).toBe(true)
    })
    it('measured', () => {
        expect(option.measured).toBe(option.value)
    })
    it('onSome', () => {
        expect(option.onSome(mock)).toBe(option)
        expect(mock).toHaveBeenCalledWith(option.value)
    })
    it('onNone', () => {
        expect(option.onNone(mock)).toBe(option)
        expect(mock).not.toHaveBeenCalled()
    })
    it('onBoth', () => {
        expect(option.onBoth(mock)).toBe(option)
        expect(mock).toHaveBeenCalledWith(option.value)
    })
    it('bind', () => {
        let expectedBound: IOption<number>
        const binder = jest.fn((value: number): IOption<number> => {
            return expectedBound = new Some(value * 2)
        })
        const bound = option.bind(binder)
        expect(binder).toHaveBeenCalledWith(option.value)
        expect(bound).toBe(expectedBound!)
    })
    it('map', () => {
        let expectedValue: number
        const mock = jest.fn((value: number): number => {
            return expectedValue = value * 2
        })
        const mapped = option.map(mock)
        expect(mapped.hasValue).toBe(true)
        expect(mapped.value).toBe(expectedValue!)
    })
    describe('zip', () => {
        let other: IOption<string>

        it('other.hasValue is true', () => {
            other = new Some(generateString())
            const zipped = option.zip(other)
            expect(zipped.hasValue).toBe(true)
            expect(Array.isArray(zipped.value)).toBe(true)
            expect(zipped.value.length).toBe(2)
            expect(zipped.value[0]).toBe(option.value)
            expect(zipped.value[1]).toBe(other.value)
        })
        it('other.hasValue is false', () => {
            other = NONE
            const zipped = option.zip(other)
            expect(zipped.hasValue).toBe(false)
        })
        it('other.hasValue is true but it is returned by a factory', () => {
            const factory = jest.fn((value: number): IOption<string> => {
                return other = new Some(value.toString())
            })
            const zipped = option.zip(factory)
            expect(factory).toHaveBeenCalledWith(option.value)
            expect(zipped.hasValue).toBe(true)
            expect(Array.isArray(zipped.value)).toBe(true)
            expect(zipped.value.length).toBe(2)
            expect(zipped.value[0]).toBe(option.value)
            expect(zipped.value[1]).toBe(other.value)
        })
        it('other.hasValue is false but it is returned by a factory', () => {
            const factory = jest.fn((): IOption<string> => {
                return other = NONE
            })
            const zipped = option.zip(factory)
            expect(factory).toHaveBeenCalledWith(option.value)
            expect(zipped.hasValue).toBe(false)
        })
    })
    it('or', () => {
        const orValue = option.or(mock)
        expect(mock).not.toHaveBeenCalled()
        expect(orValue).toBe(option.value)
    })
    it('get', () => {
        const gottenValue = option.get(mock)
        expect(mock).not.toHaveBeenCalled()
        expect(gottenValue).toBe(option.value)
    })
    it('toResult', () => {
        const result = option.toResult(mock)
        expect(mock).not.toHaveBeenCalled()
        expect(result.isSucceeded).toBe(true)
        expect(result.value).toBe(option.value)
    })
    it('toAsync', async () => {
        const asyncOption = option.toAsync()
        const hasValue = await asyncOption.hasValue
        expect(hasValue).toBe(true)
        const value = await asyncOption.value
        expect(value).toBe(option.value)
    })
})
describe('None', () => {
    beforeEach(() => {
        option = NONE
    })
    it('value', () => {
        expect(() => option.value).toThrow(ValueNotProvidedError.DEFAULT_MESSAGE)
    })
    it('hasValue', () => {
        expect(option.hasValue).toBe(false)
    })
    it('measured', () => {
        expect(option.measured).toBe(undefined)
    })
    it('onSome', () => {
        option.onSome(mock)
        expect(mock).not.toHaveBeenCalled()
    })
    it('onNone', () => {
        option.onNone(mock)
        expect(mock).toHaveBeenCalled()
    })
    it('onBoth', () => {
        option.onBoth(mock)
        expect(mock).toHaveBeenCalledWith(undefined)
    })
    it('bind', () => {
        const bound = option.bind(mock)
        expect(mock).not.toHaveBeenCalled()
        expect(bound).toBe(option)
    })
    it('map', () => {
        const mapped = option.map(mock)
        expect(mock).not.toHaveBeenCalled()
        expect(mapped).toBe(option)
    })
    describe('zip', () => {
        it('other', () => {
            const zipped = option.zip(NONE)
            expect(zipped).toBe(option)
        })
        it('factory', () => {
            const zipped = option.zip(mock)
            expect(mock).not.toHaveBeenCalled()
            expect(zipped).toBe(option)
        })
    })
    it('or', () => {
        const expectedOrValue = generateString()
        const orValue = option.or(() => expectedOrValue)
        expect(orValue).toBe(expectedOrValue)
    })
    it('get', () => {
        const expectedError = new Error()
        expect(() => option.get(() => expectedError)).toThrow(expectedError)
    })
    it('toResult', () => {
        const expectedError = generateString()
        const result = option.toResult(() => expectedError)
        expect(result.isSucceeded).toBe(false)
        expect(result.error).toBe(expectedError)
    })
    it('toAsync', async () => {
        const asyncOption = option.toAsync()
        const hasValue = await asyncOption.hasValue
        expect(hasValue).toBe(false)
    })
})
it('NONE', () => {
    expect(NONE).toBeInstanceOf(None)
})
it('ASYNC_NONE', () => {
    expect(ASYNC_NONE).toBeInstanceOf(AsyncOptionImpl)
})
describe('Success', () => {
    beforeEach(() => {
        inputValue = generateInteger()
        result = new Success(inputValue)
    })
    it('value', () => {
        expect(result.value).toBe(inputValue)
    })
    it('error', () => {
        expect(() => result.error).toThrow(ValueNotProvidedError.DEFAULT_MESSAGE)
    })
    it('isSucceeded', () => {
        expect(result.isSucceeded).toBe(true)
    })
    it('measured', () => {
        expect(result.measured).toBe(result.value)
    })
    it('onSuccess', () => {
        expect(result.onSuccess(mock)).toBe(result)
        expect(mock).toHaveBeenCalledWith(result.value)
    })
    it('onFailure', () => {
        expect(result.onFailure(mock)).toBe(result)
        expect(mock).not.toHaveBeenCalled()
    })
    it('onBoth', () => {
        expect(result.onBoth(mock)).toBe(result)
        expect(mock).toHaveBeenCalledWith(result.value)
    })
    it('swap', () => {
        const swapped = result.swap()
        expect(swapped).toBeInstanceOf(Failure)
        expect(swapped.error).toBe(result.value)
    })
    it('cast', () => {
        expect(() => result.cast()).toThrow(ValueNotProvidedError.DEFAULT_MESSAGE)
    })
    it('bind', () => {
        let expectedBound: IResult<string, number>
        const binder = jest.fn((value: number): IResult<string, number> => {
            return expectedBound = new Success(value.toString())
        })
        const bound = result.bind(binder)
        expect(binder).toHaveBeenCalledWith(result.value)
        expect(bound).toBe(expectedBound!)
    })
    it('bindError', () => {
        expect(result.bindError(mock)).toBe(result)
        expect(mock).not.toHaveBeenCalled()
    })
    it('map', () => {
        let expectedValue: string
        const mapper = jest.fn((value: number): string => {
            return expectedValue = value.toString()
        })
        const mapped = result.map(mapper)
        expect(mapper).toHaveBeenCalledWith(result.value)
        expect(mapped).toBeInstanceOf(Success)
        expect(mapped.value).toBe(expectedValue!)
    })
    it('mapError', () => {
        expect(result.mapError(mock)).toBe(result)
        expect(mock).not.toHaveBeenCalled()
    })
    describe('zip', () => {
        let other: IResult<string, number>
        let zipped: IResult<[number, string], number>

        describe('other.isSucceeded is true', () => {
            afterEach(() => {
                expect(zipped).toBeInstanceOf(Success)
                expect(Array.isArray(zipped.value)).toBe(true)
                expect(zipped.value.length).toBe(2)
                expect(zipped.value[0]).toBe(result.value)
                expect(zipped.value[1]).toBe(other.value)
            })
            it('with object', () => {
                other = new Success(generateString())
                zipped = result.zip(other)
            })
            it('with factory', () => {
                const factory = jest.fn((value: number): IResult<string, number> => {
                    return other = new Success(value.toString())
                })
                zipped = result.zip(factory)
                expect(factory).toHaveBeenCalledWith(result.value)
            })
        })
        describe('other.isSucceeded is false', () => {
            afterEach(() => {
                expect(zipped).toBeInstanceOf(Failure)
                expect(zipped.error).toBe(other.error)
            })
            it('with object', () => {
                other = new Failure(generateInteger())
                zipped = result.zip(other)
            })
            it('with factory', () => {
                const factory = jest.fn((value: number): IResult<string, number> => {
                    return other = new Failure(value * 5)
                })
                zipped = result.zip(factory)
                expect(factory).toHaveBeenCalledWith(result.value)
            })
        })
    })
    it('or', () => {
        const orValue = result.or(mock)
        expect(mock).not.toHaveBeenCalled()
        expect(orValue).toBe(result.value)
    })
    it('get', () => {
        const gottenValue = result.get(mock)
        expect(mock).not.toHaveBeenCalled()
        expect(gottenValue).toBe(result.value)
    })
    it('toOption', () => {
        const option = result.toOption()
        expect(option).toBeInstanceOf(Some)
        expect(option.value).toBe(result.value)
    })
    it('toAsync', async () => {
        const awaitedResult = await result.toAsync()
        expect(awaitedResult).toBe(result)
    })
})
describe('Failure', () => {
    beforeEach(() => {
        inputValue = generateInteger()
        result = new Failure(inputValue)
    })
    it('value', () => {
        expect(() => result.value).toThrow(ValueNotProvidedError.DEFAULT_MESSAGE)
    })
    it('error', () => {
        expect(result.error).toBe(inputValue)
    })
    it('isSucceeded', () => {
        expect(result.isSucceeded).toBe(false)
    })
    it('measured', () => {
        expect(result.measured).toBe(result.error)
    })
    it('onSuccess', () => {
        expect(result.onSuccess(mock)).toBe(result)
        expect(mock).not.toHaveBeenCalled()
    })
    it('onFailure', () => {
        expect(result.onFailure(mock)).toBe(result)
        expect(mock).toHaveBeenCalledWith(result.error)
    })
    it('onBoth', () => {
        expect(result.onBoth(mock)).toBe(result)
        expect(mock).toHaveBeenCalledWith(result.error)
    })
    it('swap', () => {
        const swapped = result.swap()
        expect(swapped).toBeInstanceOf(Success)
        expect(swapped.value).toBe(result.error)
    })
    it('cast', () => {
        const casted = result.cast()
        expect(casted).toBe(result)
    })
    it('bind', () => {
        expect(result.bind(mock)).toBe(result)
        expect(mock).not.toHaveBeenCalled()
    })
    it('bindError', () => {
        let expectedBound: IResult<number, number>
        const binder = jest.fn((error: number): IResult<number, number> => {
            return expectedBound = new Success(error * 2)
        })
        const bound = result.bindError(binder)
        expect(binder).toHaveBeenCalledWith(result.error)
        expect(bound).toBe(expectedBound!)
    })
    it('map', () => {
        expect(result.map(mock)).toBe(result)
        expect(mock).not.toHaveBeenCalled()
    })
    it('mapError', () => {
        let expectedError: number
        const mapper = jest.fn((error: number): number => {
            return expectedError = error * 2
        })
        const mapped = result.mapError(mapper)
        expect(mapper).toHaveBeenCalledWith(result.error)
        expect(mapped).toBeInstanceOf(Failure)
        expect(mapped.error).toBe(expectedError!)
    })
    describe('zip', () => {
        let zipped: IResult<[number, string], number>

        afterEach(() => {
            expect(zipped).toBeInstanceOf(Failure)
            expect(zipped.error).toBe(result.error)
        })
        it('with object', () => {
            zipped = result.zip(new Success(generateString()))
        })
        it('with factory', () => {
            zipped = result.zip(mock)
            expect(mock).not.toHaveBeenCalled()
        })
    })
    it('or', () => {
        let expectedOrValue: string
        const factory = jest.fn((error: number): string => {
            return expectedOrValue = error.toString()
        })
        const orValue = result.or(factory)
        expect(factory).toHaveBeenCalledWith(result.error)
        expect(orValue).toBe(expectedOrValue!)
    })
    it('get', () => {
        let expectedMessage: string
        const factory = jest.fn((error: number): Error => {
            return new Error(error.toString())
        })
        expect(() => result.get(factory)).toThrow(expectedMessage!)
        expect(factory).toHaveBeenCalledWith(result.error)
    })
    it('toOption', () => {
        const option = result.toOption()
        expect(option).toBe(NONE)
    })
    it('toAsync', async () => {
        const awaitedResult = await result.toAsync()
        expect(awaitedResult).toBe(result)
    })
})
