import {
  type MutationFunctionContext,
  QueryClient
} from '@tanstack/react-query'
import { describe, expect, test, vi } from 'vitest'

import { toMutationCallbacks } from '@/lib/query/mutationCallbacks.adapter'

const VARIABLES = { id: 'item-1' }
const DATA = { saved: true }
const FAILURE = new Error('refused')
const MUTATE_RESULT = undefined
const CONTEXT: MutationFunctionContext = {
  client: new QueryClient(),
  meta: undefined
}

const makeCallbacks = () => ({
  onError: vi.fn(),
  onMutate: vi.fn(),
  onSettled: vi.fn(),
  onSuccess: vi.fn()
})

describe('toMutationCallbacks', () => {
  test('hands onError the error and the variables TanStack Query passes as arguments', () => {
    const callbacks = makeCallbacks()

    toMutationCallbacks(callbacks).onError?.(
      FAILURE,
      VARIABLES,
      MUTATE_RESULT,
      CONTEXT
    )

    expect(callbacks.onError).toHaveBeenCalledWith({
      error: FAILURE,
      variables: VARIABLES
    })
  })

  test('hands onMutate the variables TanStack Query passes as an argument', async () => {
    const callbacks = makeCallbacks()

    await toMutationCallbacks(callbacks).onMutate?.(VARIABLES, CONTEXT)

    expect(callbacks.onMutate).toHaveBeenCalledWith({
      variables: VARIABLES
    })
  })

  test('leaves onMutate out when none is given, so the client default stays', () => {
    const { onError, onSettled, onSuccess } = makeCallbacks()

    expect(
      toMutationCallbacks({ onError, onSettled, onSuccess })
    ).not.toHaveProperty('onMutate')
  })

  test('hands onSettled the data, the error and the variables TanStack Query passes as arguments', () => {
    const callbacks = makeCallbacks()

    toMutationCallbacks(callbacks).onSettled?.(
      DATA,
      null,
      VARIABLES,
      MUTATE_RESULT,
      CONTEXT
    )

    expect(callbacks.onSettled).toHaveBeenCalledWith({
      data: DATA,
      error: null,
      variables: VARIABLES
    })
  })

  test('hands onSuccess the data and the variables TanStack Query passes as arguments', () => {
    const callbacks = makeCallbacks()

    toMutationCallbacks(callbacks).onSuccess?.(
      DATA,
      VARIABLES,
      MUTATE_RESULT,
      CONTEXT
    )

    expect(callbacks.onSuccess).toHaveBeenCalledWith({
      data: DATA,
      variables: VARIABLES
    })
  })
})
