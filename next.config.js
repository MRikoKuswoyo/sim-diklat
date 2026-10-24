/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // jangan umumkan "X-Powered-By: Next.js"
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },                       // cegah halaman dibingkai situs lain (clickjacking)
          { key: "X-Content-Type-Options", value: "nosniff" },             // browser tidak menebak tipe file
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
