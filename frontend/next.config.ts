import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // For production build on leads.libraro.in
  output: "export",
};

export default nextConfig;
