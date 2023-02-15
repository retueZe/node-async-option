import type { Failure } from './Failure'
import type { Success } from './Success'

/** @since v2.0.0 */
export type Result<T, E = unknown> = Success<T> | Failure<E>
