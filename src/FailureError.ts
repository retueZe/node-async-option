/** @since v1.0.0 */
export type FailureError<M> = ({
    [R in keyof M]: {reason: R} & M[R]
})[keyof M]
