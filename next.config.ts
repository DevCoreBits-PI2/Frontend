import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["http://192.168.50.1:3001", "http://192.168.50.1:3000"],
};

export default nextConfig;
