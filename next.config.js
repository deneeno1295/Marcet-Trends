const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'cytoscape'],
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
  images: {
    domains: ['img.clerk.com', 'images.clerk.dev'],
  },
};

module.exports = withSentryConfig(
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
);


