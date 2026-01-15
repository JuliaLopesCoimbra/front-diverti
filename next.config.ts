import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // <--- ADICIONE ESTA LINHA AQUI
  images: {
    unoptimized: true, // <--- OBRIGATÓRIO PARA EXPORT ESTÁTICO SE USAR <Image />
    remotePatterns: [
      {
        protocol: "https",
        hostname: "n1-bucket-s3.s3.sa-east-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      "@": "./",
    },
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
};

export default nextConfig;