import { Async, IOption, IResult } from './abstraction'

/** @since v1.7.0 */
export type OptionValue<T> = T extends Async<IOption<infer U>> ? U : never
/** @since v1.7.0 */
export type ResultValue<T> = T extends Async<IResult<infer U, any>> ? U : never
/** @since v1.7.0 */
export type ResultError<T> = T extends Async<IResult<any, infer U>> ? U : never
