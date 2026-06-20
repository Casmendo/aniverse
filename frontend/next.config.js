/** @type {import('next').NextConfig} */
const isAndroid = process.env.BUILD_TARGET === 'android';

const nextConfig = {
  ...(isAndroid ? { output: 'export' } : {}),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
    dangerouslyAllowSVG: true,
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://aniverse-xi.vercel.app',
  },

  ...(isAndroid ? {} : {
    async rewrites() {
      return [
        {
          source: '/backend_api/:path*',
          destination: 'http://projcts.ayohost.site:3008/:path*',
        },
      ];
    },
    async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: data: blob:;" }
        ],
      },
    ];
  }}),
};

module.exports = nextConfig;
