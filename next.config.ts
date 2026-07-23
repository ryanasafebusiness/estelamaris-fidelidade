import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Serve formatos modernos e comprimidos quando o navegador suporta
    // (a logo/ícones já usam next/image, então isso já reduz o payload).
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Faz tree-shaking dessas libs por rota em vez de empacotar tudo no
    // bundle compartilhado — framer-motion (usado em todo template.tsx),
    // qrcode.react e qr-scanner (WASM, só a tela do scanner precisa).
    optimizePackageImports: ["framer-motion", "qrcode.react", "qr-scanner"],
  },
};

export default nextConfig;
