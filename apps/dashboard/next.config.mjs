import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const monorepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // In a monorepo, standalone output must trace from the repo root so workspace
  // packages (@modyrn/*) are bundled into the Docker image.
  outputFileTracingRoot: monorepoRoot,
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@modyrn/shared'],
  // Linting runs as a dedicated `pnpm lint` step (and in CI); don't duplicate it
  // during the production build.
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Ensure workspace packages resolve correctly in the monorepo.
    externalDir: true,
  },
  async rewrites() {
    // Proxy browser-originated API calls through the dashboard's own origin so
    // session cookies are same-origin and the API never needs public exposure.
    //
    // IMPORTANT: Next evaluates rewrites() at BUILD time and bakes the result
    // into the standalone server — it does NOT read runtime env. `next build`
    // runs with NODE_ENV=production, so we bake the internal Docker service
    // name (http://api:4000) for production images, and use localhost for local
    // development (where `next dev` evaluates this live). A build-time API_URL
    // still takes precedence if you build a custom image.
    const apiUrl =
      process.env.API_URL ??
      (process.env.NODE_ENV === 'production' ? 'http://api:4000' : 'http://localhost:4000');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
