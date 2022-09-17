/** @since v0.1.0 */
export type FailureError<M> = ({
    [R in keyof M]: {reason: R} & M[R]
})[keyof M]
