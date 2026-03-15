/** API error shape for ApiResult (Standard 02/04). */
export interface ApiError {
  code: string
  message: string
}

/** Result type for all RPCs: success with data or failure with error. */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }
