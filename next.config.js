/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/py/:path*",
        destination: "http://localhost:8000/api/py/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
