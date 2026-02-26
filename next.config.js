const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  // Disable SW in development by default (faster HMR)
  // Set ENABLE_PWA=true to test offline functionality in dev
  disable: process.env.NODE_ENV === "development" && !process.env.ENABLE_PWA,
  register: false,
  skipWaiting: true,
  sw: "sw.js",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
