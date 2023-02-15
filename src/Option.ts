import type { AsyncOption, AsyncResult } from './async'
import type { Failure } from './Failure'
import type { None } from './None'
import type { Some } from './Some'
import type { Success } from './Success'

/** @since v2.0.0 */
export type Option<T> = Some<T> | None
/** @since v2.0.0 */
export type ValueOf<C> = C extends Some<infer T>
    ? T
    : C extends None
        ? never
        : C extends Success<infer T>
            ? T
            : C extends Failure
                ? never
                : C extends AsyncOption<infer T>
                    ? T
                    : C extends AsyncResult<infer T>
                        ? T
                        : never
/** @since v2.0.0 */
export type ErrorOf<C> = C extends Some<any>
    ? never
    : C extends None
        ? undefined
        : C extends Success<any>
            ? never
            : C extends Failure<infer E>
                ? E
                : C extends AsyncOption<any>
                    ? undefined
                    : C extends AsyncResult<any, infer E>
                        ? E
                        : never
