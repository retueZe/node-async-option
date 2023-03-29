import { Success } from '..'
import { Async } from './AsyncOption'
import { AsyncResult } from './AsyncResult'
import { then } from '../utils/async'

/** @since v2.0.0 */
export const AsyncSuccess: AsyncSuccessConstructor = class AsyncSuccess<T> extends AsyncResult<T, never> {
    /** @since v2.0.0 */
    constructor(value: Async<T>) {
        super(then(value, value => new Success(value)))
    }
}
interface AsyncSuccessConstructor {
    readonly prototype: AsyncResult<any, never>

    new<T, E = never>(value: Async<T>): AsyncResult<T, E>
}
