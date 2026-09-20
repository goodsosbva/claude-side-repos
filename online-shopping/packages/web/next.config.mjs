/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@shop/ui", "@shop/shared"],
  output: "standalone",
};

export default nextConfig;
