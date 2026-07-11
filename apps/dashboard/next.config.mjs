/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
