// ---------------------------------------------------------------------------
// git-free-env — the environment a child of a git hook starts in.
//
// Git exports GIT_DIR, GIT_INDEX_FILE and GIT_WORK_TREE into a hook. A git
// command run under them resolves the hook's repository whatever its `cwd`,
// and a program started under them hands them to every git it starts in
// turn.
// ---------------------------------------------------------------------------

const GIT_VARIABLE = /^GIT_/i

// Every variable of `environment` except the GIT_* ones, matched without
// regard to case: `git_dir` is dropped as well.
export const gitFreeEnv = ({ environment = process.env } = {}) =>
  Object.fromEntries(
    Object.entries(environment).filter(([key]) => !GIT_VARIABLE.test(key))
  )
