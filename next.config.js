const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'cytoscape', 'puppeteer'],
    instrumentationHook: true,
  },
  webpack: (config, { isServer }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    
    // Exclude puppeteer from client bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'puppeteer': false,
      };
    }
    
    return config;
  },
  images: {
    domains: ['img.clerk.com', 'images.clerk.dev'],
  },
  // Increase build timeout for Vercel
  staticPageGenerationTimeout: 180,
};

// Only wrap with Sentry if auth token is available
module.exports = process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(
      nextConfig,
      {
        // Sentry config options
        silent: true,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
      {
        // Upload source maps for better error tracking
        widenClientFileUpload: true,
        transpileClientSDK: true,
        tunnelRoute: '/monitoring',
        hideSourceMaps: true,
        disableLogger: true,
      }
    )
  : nextConfig;


