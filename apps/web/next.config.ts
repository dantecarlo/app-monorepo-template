import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Makes rendering dynamic-by-default and enables the 'use cache' directive,
  // cacheLife(), and cacheTag() APIs. Server Components wrapped with those
  // APIs stream cached output; client islands are unaffected.
  cacheComponents: true,
  experimental: {
    // Unlocks React's <ViewTransition> API for animated page transitions.
    // Opting individual transitions in is left to consumers; no component
    // changes are required to keep the build green.
    viewTransition: true
  },
  // Enables the React Compiler (Babel pass). Runs via babel-plugin-react-compiler.
  // @babel/core 7.x is already in the tree so no additional toolchain change.
  reactCompiler: true,
  reactStrictMode: true,
  // Generates .next/types with a statically-typed Routes union so Link
  // href and router.push() calls are checked at compile time.
  typedRoutes: true
}

export default nextConfig
