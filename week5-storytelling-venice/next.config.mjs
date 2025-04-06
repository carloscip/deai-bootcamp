/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Output as standalone build for optimal serverless deployment on Vercel
  output: 'standalone',
  // Transpile specific packages that need it
  transpilePackages: ['@rainbow-me/rainbowkit'],
};

export default nextConfig;

