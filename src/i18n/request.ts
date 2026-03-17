import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Load all message namespaces for the locale
  const common = (await import(`../../messages/${locale}/common.json`)).default;
  const nav = (await import(`../../messages/${locale}/nav.json`)).default;
  const auth = (await import(`../../messages/${locale}/auth.json`)).default;
  const publishers = (await import(`../../messages/${locale}/publishers.json`))
    .default;
  const meetings = (await import(`../../messages/${locale}/meetings.json`))
    .default;
  const history = (await import(`../../messages/${locale}/history.json`))
    .default;
  const settings = (await import(`../../messages/${locale}/settings.json`))
    .default;

  return {
    locale,
    messages: {
      ...common,
      ...nav,
      ...auth,
      ...publishers,
      ...meetings,
      ...history,
      ...settings,
    },
  };
});
