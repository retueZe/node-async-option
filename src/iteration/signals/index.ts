import { Failure } from '../..'

/** @since v2.0.0 */
export const BREAK = new Failure<'break'>('break')
/** @since v2.0.0 */
export const ABORT = new Failure<'abort'>('abort')
