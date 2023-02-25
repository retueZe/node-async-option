import type { AsyncOptionLike, AsyncResultLike } from './async'
import type { FailureLike } from './Failure'
import type { None, NoneLike } from './None'
import type { Some, SomeLike } from './Some'
import type { SuccessLike } from './Success'

/** @since v2.0.0 */
export type Option<T> = Some<T> | None
/** @since v2.0.0 */
export type OptionLike<T> = SomeLike<T> | NoneLike
/** @since v2.0.0 */
export type ValueOf<C> = C extends SomeLike<infer T>
    ? T
    : C extends NoneLike
        ? never
        : C extends SuccessLike<infer T>
            ? T
            : C extends FailureLike
                ? never
                : C extends AsyncOptionLike<infer T>
                    ? T
                    : C extends AsyncResultLike<infer T, any>
                        ? T
                        : never
/** @since v2.0.0 */
export type ErrorOf<C> = C extends SomeLike<any>
    ? never
    : C extends NoneLike
        ? undefined
        : C extends SuccessLike<any>
            ? never
            : C extends FailureLike<infer E>
                ? E
                : C extends AsyncOptionLike<any>
                    ? undefined
                    : C extends AsyncResultLike<any, infer E>
                        ? E
                        : never
