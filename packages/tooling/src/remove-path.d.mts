/**
 * Removes `path` recursively, a file or a folder with everything under it;
 * returns when it is already gone (ENOENT) and rethrows every other failure.
 * `fs` is injected by tests and by callers that inject their own.
 */
export declare const removePath: (params: {
  fs?: {
    rmSync: (path: string, options: { recursive: boolean }) => void
  }
  path: string
}) => void
