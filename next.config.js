const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: false,
  register: true,
  skipWaiting: true,
  sw: "sw.js",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
};

module.exports = withPWA(nextConfig);
