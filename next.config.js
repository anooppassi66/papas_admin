/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'http', hostname: 'localhost', port: '5001' },{ protocol: 'http', hostname: '52.64.40.205', port: '4003' }],
  },
};

module.exports = nextConfig;
