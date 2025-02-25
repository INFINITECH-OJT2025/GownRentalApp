/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.unsplash.com"], 
      remotePatterns: [
          {
              protocol: "http",
              hostname: "127.0.0.1",
              port: "8000",
              pathname: "/storage/**",
          },
      ],
  },
};
  
module.exports = nextConfig;
