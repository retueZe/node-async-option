## Description

Such monads like "option" and "result" are commonly used to process some data and have an opportunity to catch any kind of failure. Option can be a value or the special value - "none" - meanwhile result can be a value or an error containing additional information about the failure. Occasionally, the proccessing data can be fed asynchronously. This library implements the basic synchronous variation of these 2 monads and additionally the asynchronous one. There're also a bunch of utility stuff helping solve the problem.

## Examples

### Options example

```javascript
import { AsyncSome } from 'async-option/async'
import { from } from 'async-option/utils/option'
import { extractAsync } from 'async-option/utils/option'

// parsing some header line
const HEADER_LINE_PATTERN = /(?<name>[a-z]+)=(?<url>.*)/i
const contents = {}

new AsyncSome(readLine()) // some async input function
    // convert `T | undefined` to `Option<T>`
    .bind(line => from(HEADER_LINE_PATTERN.exec(line) ?? undefined))
    .map(match => match.groups)
    // if all options in the object have value, returns a compiled object of their values
    .bind(({name, url}) => extractAsync({
        name: validateName(name), // sync option
        content: new AsyncSome(fetch(url)) // async option
            .bind(res => from(res.ok ? res.text() : undefined))
    }))
    // executes only if the option has a value
    .onSome(({name, content}) => contents[name] = content)
    // `AsyncOption<T>` extends `Promise<Option<T>>`
    .then(() => console.log(contents))
```

### Results example

```javascript
import { Success } from 'async-option'
import * as OptionUtils from 'async-option/utils/option'
import * as ResultUtils from 'async-option/utils/result'

// this pattern is incorrect and used for demonstration purposes
const EMAIL_PATTERN = /(?<userName>[^@]+)@(?<hostAddress>.+)/i
const EMAIL = 'me@example.net'
const ERROR_MESSAGES = {
    'user-name-required': 'User name required.',
    'invalid-user-name': 'Invalid user name.'
}

OptionUtils.from(EMAIL_PATTERN.exec(EMAIL) ?? undefined)
    .toResult(() => 'user-name-required')
    .map(match => match.groups)
    .bind(({userName, hostAddress}) => ResultUtils.extract({
        // the function from the previous example
        userName: validateName(userName).toResult(() => 'invalid-user-name')
        hostAdress: new Success(hostAddress)
    }))
    .mapError(code => ERROR_MESSAGES[code])
    // passes measured result i.e. either inner value or error
    .onBoth(console.log)
```

### `async-option/iteration` namespace example #1

```javascript
import { map } from 'async-option/iteration'

// the first example wrapped in a function
function parseHeader(input) {
    // ...
}

// our input
const input = ...

Option.some(input)
    .map(input => input.split('\n'))
    // `OptionUtils.all` is bad here, because we parse all lines at once,
    // and after all we do check whether they are valid or not. All functions
    // inside the `Iteration` namespace checks result after each iteration.
    // These functions returns results, and their errors indicate the index of
    // the item that stopped the exection, i.e. iteration count. So, we need
    // to map it to option.
    .bind(lines => map(lines, parseHeader).toOption())
    .onBoth(console.log)
```

### `async-option/iteration` namespace example #2

```javascript
import { Some } from 'async-option'
import { forEach } from 'async-option/iteration'

const pairs = [['a', 123], ['b', 'string'], ['c', true]]

// creating an object from the key-value pair array
new Some(pairs)
    .bind(pairs => new Success({})
        .bind(object => forEach(pairs, ([key, value]) => {
            object[key] = value
        }))
        // `forEach` returns iteration count. So, we need to map it.
        // you can also return values such as 'break' or 'abort' to interrupt
        // the loop (see JSDoc)
        .toOption()
        .map(() => object))
    .onBoth(console.log)
```

### Creating `else-if` chains

```javascript
import { NONE } from 'async-option'

const DEFAULT_INDENT = ' '.repeat(4)

// we want a `string | number | boolean | null | undefined` -> `string` function
function normalizeIndent(indent) {
    return NONE // `elseIf` fires only if option is none
        .elseIf(
            () => typeof indent === 'undefined' ||
                indent === null ||
                (typeof indent === 'boolean' && indent),
            () => DEFAULT_INDENT)
        .elseIf([ // implies logical AND (for multiple filters)
            () => typeof indent === 'boolean'
            () => !indent,
        ], () => '')
        .elseIf(() => typeof indent === 'number', () => ' '.repeat(indent))
        .elseIf(() => typeof indent === 'string', () => indent)
}

const INDENTS = [
    'abc',
    2,
    true,
    false,
    null,
    undefined,
    {}
]

for (const indent of INDENTS)
    normalizeIndent(indent)
        .onBoth(normalized => console.log(indent, typeof normalized === 'string'
            ? `"${normalized}"`
            : normalized))

// Output:
// abc "abc"
// 2 "  "
// true "    "
// false ""
// null "    "
// undefined "    "
// {} undefined
```

### `GenericFailureError` TS example

```typescript
import * as OptionUtils from 'async-option/utils/option'
import * as Parsers from 'async-option/parsers'

// might've used enums here
interface PortParserErrorMap {
    'bad-input': {
        input: string
    }
    'out-of-range': {
        min: number
        max: number
        actual: number
    }
}
type PortParserError = GenericFailureError<PortParserErrorMap>

const MIN_PORT = 1024
const MAX_PORT = 0xffff

function parsePort(input: string): Result<number, PortParserError> {
    // proper integer parser returning options
    return Parsers.integer(input)
        .toResult<PortParserError>(() => ({reason: 'bad-input', input}))
        // result's `filter` method consumes a callback returning an option containing an error, so, if
        // the option has value, the result become a failure containing that error; otherwise nothing changes
        .filter(port => OptionUtils.EMPTY // option containing `undefined`
            // condition of faillure
            .filter(() => port < MIN_PORT - 0.5 || port > MAX_PORT + 0.5)
            // executes only if failed, so, no extra objects created if it is succeeded
            .map(() => ({
                reason: 'out-of-range',
                min: MIN_PORT,
                max: MAX_PORT,
                actual: port
            })))
}

const PORTS = [
    'abc',
    '1000',
    '80000',
    '8000'
]

for (const port of PORTS)
    parsePort(port)
        .onSuccess(port => console.log('port:', port))
        .onFailure(error => console.log('error:', error))

// Output:
// error: { reason: 'bad-input', input: 'abc' }
// error: { reason: 'out-of-range', min: 1024, max: 65535, actual: 1000 }
// error: { reason: 'out-of-range', min: 1024, max: 65535, actual: 80000 }
// port: 8000
```
