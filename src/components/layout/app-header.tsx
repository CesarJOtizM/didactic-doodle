'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';

export function AppHeader() {
  const t = useTranslations('common');
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
      </div>
      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 size-4" />
          {t('logout')}
        </Button>
      </div>
    </header>
  );
}
