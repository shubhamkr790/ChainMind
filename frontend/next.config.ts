import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix workspace root warning
  outputFileTracingRoot: process.cwd(),
  
  // Disable React Strict Mode in development to prevent WalletConnect double initialization
  reactStrictMode: false,
  
  // Optimize for production
  compress: true,
  
  // Better error handling
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Webpack configuration
  webpack: (config: any) => {
    // Fix pino-pretty warning by ignoring it in client builds
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
    };
    
    // Ignore webpack warnings for known issues
    config.ignoreWarnings = [
      { module: /node_modules\/pino\/lib\/tools\.js/ },
      { file: /node_modules\/pino\/lib\/tools\.js/ },
    ];
    
    return config;
  },
};

export default nextConfig;
