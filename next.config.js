/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'http', hostname: 'localhost', port: '5001' },{ protocol: 'http', hostname: '52.64.40.205', port: '4003' },{ protocol: 'http', hostname: '32.199.52.84', port: '4003' },{ protocol: 'http', hostname: '32.199.52.84', port: '5001' }],
  },
};

module.exports = nextConfig;
