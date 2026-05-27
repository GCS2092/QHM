import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer tente d'importer 'canvas' qui n'existe pas
  // dans l'environnement serveur Node.js. On l'aliase vers false pour
  // eviter le crash webpack au build.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
