import { Failure } from '..'
import { Async } from './AsyncOption'
import { AsyncResult } from './AsyncResult'
import { then } from '../utils/async'

/** @since v2.0.0 */
export const AsyncFailure: AsyncFailureConstructor = class AsyncFailure<E> extends AsyncResult<never, E> {
    /** @since v2.0.0 */
    constructor(error: Async<E>) {
        super(then(error, value => new Failure(value)))
    }
}
interface AsyncFailureConstructor {
    readonly prototype: AsyncResult<never, any>

    new<E>(error: Async<E>): AsyncResult<never, E>
}
