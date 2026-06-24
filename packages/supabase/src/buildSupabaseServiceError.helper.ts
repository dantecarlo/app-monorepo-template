import type { AppError } from '@app/core'
import { buildServiceError } from '@app/core'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { mapSupabaseError } from './mapSupabaseError.adapter'

interface IBuildSupabaseServiceErrorParams {
  error: unknown
}

export const buildSupabaseServiceError = ({
  error
}: IBuildSupabaseServiceErrorParams): AppError =>
  buildServiceError({ error, mapper: mapSupabaseError })
