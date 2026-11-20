/** Spread into `spawn` options for a child whose tree may need ending. */
export declare const TREE_SPAWN_OPTIONS: Readonly<{ detached: boolean }>

/**
 * Signals `child` and its descendants; Windows ends them whatever `signal`.
 * On POSIX it signals the child's process group, which holds the descendants
 * only when `child` was spawned with `TREE_SPAWN_OPTIONS`: a child spawned
 * without them receives `signal` alone, and a descendant that left the group
 * is not reached. On Windows taskkill is stopped after 5 s.
 * Returns false only when the tree could not be signalled and the child is
 * still running.
 */
export declare const signalProcessTree: (params: {
  child: { kill: (signal?: NodeJS.Signals) => boolean; pid?: number }
  signal: NodeJS.Signals
  wait?: boolean
}) => boolean
