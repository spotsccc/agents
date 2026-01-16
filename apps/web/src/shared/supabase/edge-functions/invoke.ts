import { supabase } from '@/shared/supabase'
import {
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionsFetchError,
  type EdgeFunctionResult,
  type EdgeFunctionError,
} from './types'

export async function invokeEdgeFunction<TRequest extends Record<string, unknown>, TResponse>(
  functionName: string,
  params: TRequest
): Promise<EdgeFunctionResult<TResponse>> {
  const { data, error } = await supabase.functions.invoke<TResponse>(functionName, {
    body: params as Record<string, unknown>,
  })

  if (error) {
    return { data: null, error: await parseError(error) }
  }

  return { data: data as TResponse, error: null }
}

async function parseError(error: unknown): Promise<EdgeFunctionError> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      return {
        message: body.error || 'Server error',
        type: 'http',
      }
    } catch {
      return {
        message: 'Server error',
        type: 'http',
      }
    }
  }

  if (error instanceof FunctionsRelayError) {
    return {
      message: 'Unable to connect to server',
      type: 'relay',
    }
  }

  if (error instanceof FunctionsFetchError) {
    return {
      message: 'Network error',
      type: 'fetch',
    }
  }

  return {
    message: 'An unexpected error occurred',
    type: 'unknown',
  }
}
