import type { AppError } from '@app/core'
import { buildServiceError } from '@app/core'

import { mapSupabaseError } from '@/mapSupabaseError.adapter'

interface IBuildSupabaseServiceErrorParams {
  error: unknown
}

export const buildSupabaseServiceError = ({
  error
}: IBuildSupabaseServiceErrorParams): AppError =>
  buildServiceError({ error, mapper: mapSupabaseError })
