import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@libsql/client',
      '@prisma/adapter-libsql',
      'libsql',
    ],
  },
};

export default withNextIntl(nextConfig);
