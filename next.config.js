/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'orthodoxy.sgp1.digitaloceanspaces.com',
      },
      {
        protocol: 'https',
        hostname: 'orthodoxbookshop.asia',
      },
      {
        protocol: 'https',
        hostname: 'django.orthodoxbookshop.asia',
      },
      {
        protocol: 'https',
        hostname: 'filedn.com',
      },
    ],
  },
};

module.exports = nextConfig;
