const nextConfig = {
  reactStrictMode: true,

  // Next.js 16: Turbopack is the default bundler.
  // turbopack config moves to top-level (no longer under experimental).
  // turbopack: {
  //   // Add Turbopack-specific overrides here if needed.
  //   // e.g. resolveAlias for Node built-ins used in browser bundles:
  //   // resolveAlias: { fs: { browser: "./src/lib/empty.ts" } },
  // },

  // Next.js 16: React Compiler is stable — opt in for production perf gains.
  // Auto-memoises components; safe to enable with React 19.
  reactCompiler: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;