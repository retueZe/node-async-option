export type FailureError<M extends FailureErrorDataTypeMap, C extends keyof M> = {
    code: C
} & M[C]
export interface FailureErrorDataTypeMap {
    [name: string]: object
}
