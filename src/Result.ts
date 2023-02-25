import type { Failure, FailureLike } from './Failure'
import type { Success, SuccessLike } from './Success'

/** @since v2.0.0 */
export type Result<T, E = unknown> = Success<T> | Failure<E>
/** @since v2.0.0 */
export type ResultLike<T, E = unknown> = SuccessLike<T> | FailureLike<E>
