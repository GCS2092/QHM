import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 15+ utilise Turbopack par defaut.
  // Les composants @react-pdf/renderer sont importes avec { ssr: false }
  // donc ils ne sont jamais rendus cote serveur — pas besoin d'alias canvas.
  turbopack: {},
};

export default nextConfig;
