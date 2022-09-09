## Description

Such monads like "option" and "result" are commonly used to process some data and have an opportunity to catch any kind of failure. Option can be a value or the speciial value - "none" - meanwhile result can be a value or an error containing additional information about the failure. Occasionally, the proccessing data can be fed asynchronously. This library implements the basic synchronous variation of these 2 monads and additionally the asynchronous one. There're also a bunch of utility stuff helping solve the problem.

## Examples

```javascript
// parsing some header line
const HEADER_LINE_PATTERN = /(?<name>[a-z]+)=(?<url>.*)/i
const contents = {}

AsyncOption.some(readLine()) // some async input function
    // convert `T | undefined` to `IOption<T>`
    .bind(line => Option.option(HEADER_LINE_PATTERN.exec(line) ?? undefined))
    .map(match => match.groups)
    // if all options in the object have value, returns a compiled object of their values
    .bind(({name, url}) => AsyncOption.extractObject({
        name: validateName(name), // sync option
        content: AsyncOption.some(fetch(url)) // async option
            .bind(res => Option.option(res.ok ? res.text() : undefined))
    }))
    // executes only if the option has a value
    .onSome(({name, content}) => contents[name] = content)
    // `IAsyncOption<T>` extends `Promise<IOption<T>>`
    .then(() => console.log(contents))
```

```javascript
// this pattern is incorrect and used for demonstration purposes
const EMAIL_PATTERN = /(?<userName>[^@]+)@(?<hostAddress>.+)/i
const EMAIL = 'me@example.net'
const ERROR_MESSAGES = {
    'user-name-required': 'User name required.',
    'invalid-user-name': 'Invalid user name.'
}

Option.option(EMAIL_PATTERN.exec(EMAIL) ?? undefined)
    .toResult(() => 'user-name-required')
    .map(match => match.groups)
    .bind(({userName, hostAddress}) => Result.extractObject({
        // the function from the previous example
        userName: validateName(userName).toResult(() => 'invalid-user-name')
        hostAdress: Result.success(hostAddress)
    }))
    .mapError(code => ERROR_MESSAGES[code])
    // passes measured result i.e. either inner value or error
    .onBoth(console.log)
```