import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverComponentsExternalPackages: ['@libsql/client'],
};

export default withNextIntl(nextConfig);
