import { Async, IOption, IResult } from './abstraction'

export type OptionValue<T> = T extends Async<IOption<infer U>> ? U : never
export type ResultValue<T> = T extends Async<IResult<infer U, any>> ? U : never
export type ResultError<T> = T extends Async<IResult<any, infer U>> ? U : never
