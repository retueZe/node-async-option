import { NONE, Some, OptionLike, ValueNotProvidedError } from '.'

describe('Some', () => {
    const value = {}
    const instance = new Some(value)

    it('value', () => {
        expect(instance.value).toBe(value)
    })
    it('hasValue', () => {
        instance.hasValue
    })
    it('measured', () => {
        expect(instance.measured).toBe(value)
    })
    it('onSome', () => {
        const callback = jest.fn()

        instance.onSome(callback)

        expect(callback).toBeCalledWith(value)
        expect(callback).toBeCalledTimes(1)
    })
    it('onNone', () => {
        instance.onNone()
    })
    it('onBoth', () => {
        const callback = jest.fn()

        instance.onBoth(callback)

        expect(callback).toBeCalledWith(value)
        expect(callback).toBeCalledTimes(1)
    })
    it.each<OptionLike<Record<string, never>>>([
        new Some({}),
        NONE,
        {hasValue: true, value: {}},
        {hasValue: false, get value(): never {
            throw new ValueNotProvidedError()
        }}
    ])('or', (binderResult) => {
        const binder = jest.fn(() => binderResult)

        const bound = instance.bind(binder)

        expect(binder).toBeCalledWith(instance.value)
        expect(binder).toBeCalledTimes(1)
        expect(bound.hasValue).toBe(binderResult.hasValue)

        if (bound.hasValue) expect(bound.value).toBe(binderResult.value)
    })
    it('map', () => {
        const mapperResult = {}
        const mapper = jest.fn(() => mapperResult)

        const mapped = instance.map(mapper)

        expect(mapper).toBeCalledWith(value)
        expect(mapper).toBeCalledTimes(1)
        expect(mapped.value).toBe(mapperResult)
    })
    it('wrapInside', () => {
        instance.wrapInside()
    })
    it('wrapOutside', () => {
        instance.wrapOutside()
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
    it.each([[true, instance], [false, NONE]])('filter', (conditionResult, expectedFiltered) => {
        const condition = jest.fn(() => conditionResult)

        const filtered = instance.filter(condition)

        expect(condition).toBeCalledWith(value)
        expect(condition).toBeCalledTimes(1)
        expect(filtered).toBe(expectedFiltered)
    })
    it('get', () => {
        const gotten = instance.get()

        expect(gotten).toBe(value)
    })
    it('toResult', () => {
        const result = instance.toResult()

        expect(result.value).toBe(value)
    })
    it('toAsync', async () => {
        const result = instance.toAsync()
        const awaited = await result

        expect(awaited).toBe(instance)
    })
})
