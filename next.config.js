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
};

module.exports = withPWA(nextConfig);
