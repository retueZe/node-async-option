import { Some } from '..'
import { Async, AsyncOption } from './AsyncOption'
import { then } from '../utils/async'

/** @since v2.0.0 */
export const AsyncSome: AsyncSomeConstructor = class AsyncSome<T> extends AsyncOption<T> {
    /** @since v2.0.0 */
    constructor(value: Async<T>) {
        super(then(value, value => new Some(value)))
    }
}
interface AsyncSomeConstructor {
    readonly prototype: AsyncOption<any>

    new<T>(value: Async<T>): AsyncOption<T>
}
