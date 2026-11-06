// ---------------------------------------------------------------------------
// hostConsole — typed access to `console` for the agnostic domain layer.
//
// packages/core compiles under `lib: ["ES2022"]` with no DOM lib and no
// @types/node, so host APIs carry no type here. This module declares the two
// console members the package uses.
//
// Widening IHostConsole is a contract change: add a member only if it exists in
// every target runtime (Node, browser, React Native). Anything narrower belongs
// behind a port in src/ports/.
//
// Pattern and rationale: docs/architecture/shared.md, "Host APIs in
// packages/core".
// ---------------------------------------------------------------------------

export interface IHostConsole {
  error: (...args: readonly unknown[]) => void
  warn: (...args: readonly unknown[]) => void
}

// Ambient and module-scoped: this declaration never reaches global scope.
declare const console: IHostConsole

export const hostConsole: IHostConsole = console
