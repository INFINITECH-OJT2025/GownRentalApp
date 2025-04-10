/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'https', // Assuming the domain uses HTTPS
        hostname: 'infinitech-api4.site',
        pathname: '/storage/**', // Adjust the pathname as needed
      },
    ],
  },
};

module.exports = {
  webpack: (config) => {
    config.externals = { jquery: "jQuery" };
    return config;
  },
};

  
module.exports = nextConfig;
