import nextPWA from "next-pwa";

const withPWA = nextPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  importScripts: ["/push-sw.js"],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js config options
};

export default withPWA(nextConfig);
