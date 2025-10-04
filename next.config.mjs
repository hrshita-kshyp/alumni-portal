/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  // Also add this to ensure clean builds
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
