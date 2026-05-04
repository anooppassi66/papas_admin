/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'http', hostname: 'localhost', port: '5001' }],
  },
};

module.exports = nextConfig;
