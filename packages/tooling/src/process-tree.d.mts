/** Spread into `spawn` options for a child whose tree may need ending. */
export declare const TREE_SPAWN_OPTIONS: Readonly<{ detached: boolean }>

/**
 * Signals `child` and its descendants; Windows ends them whatever `signal`.
 * Returns false only when the tree could not be signalled and the child is
 * still running.
 */
export declare const signalProcessTree: (params: {
  child: { kill: (signal?: NodeJS.Signals) => boolean; pid?: number }
  signal: NodeJS.Signals
  wait?: boolean
}) => boolean
