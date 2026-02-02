import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "n1-bucket-s3.s3.sa-east-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "app-n1-bucket-s3.s3.sa-east-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d2gggyluh33xh5.cloudfront.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d2dbwpuqh2i6wo.cloudfront.net",
        pathname: "/**",
      },
    ],
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  // Configuração do Turbopack para resolução de módulos
  turbopack: {
    resolveAlias: {
      "@": "./",
    },
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
};

export default nextConfig;