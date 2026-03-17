'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const localeLabels: Record<string, string> = {
  es: 'ES',
  en: 'EN',
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleSwitch() {
    // Toggle between the two locales
    const nextLocale =
      locale === routing.locales[0] ? routing.locales[1] : routing.locales[0];
    router.replace({ pathname }, { locale: nextLocale });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSwitch}>
      <Globe className="mr-1 size-4" />
      {localeLabels[locale] || locale.toUpperCase()}
    </Button>
  );
}
