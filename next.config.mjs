/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["chainsig.js", "got"],
};

export default nextConfig;
