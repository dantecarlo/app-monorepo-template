// A statement that creates a public type, table, view or function; group 1 is its name.
export const PUBLIC_OBJECT_CREATE_PATTERN =
  /\bcreate\s+(?:or\s+replace\s+)?(?:unlogged\s+)?(?:materialized\s+)?(?:type|table|view|function)\s+(?:if\s+not\s+exists\s+)?public\.([a-z_][a-z0-9_$]*)/g

// Any schema-qualified public name; group 1 is the name.
export const PUBLIC_OBJECT_REFERENCE_PATTERN =
  /\bpublic\.([a-z_][a-z0-9_$]*)/g

export const PUBLIC_SCHEMA_PREFIX = 'public.'
