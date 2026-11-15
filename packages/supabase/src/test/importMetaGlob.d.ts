// The one form of Vite's import.meta.glob the tests use, typed here because the package does
// not depend on vite/client. Vitest transforms the call at load time.
interface ImportMeta {
  glob: (
    pattern: string,
    options: { eager: true; import: 'default'; query: '?raw' }
  ) => Record<string, string>
}
