import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js'

export { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError }

export type EdgeFunctionError = {
  message: string
  type: 'http' | 'relay' | 'fetch' | 'unknown'
}

export type EdgeFunctionResult<T> =
  | { data: T; error: null }
  | { data: null; error: EdgeFunctionError }
