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
    // Proxy API calls through the dashboard origin so cookies work seamlessly.
    const apiUrl = process.env.API_URL ?? 'http://localhost:4000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
