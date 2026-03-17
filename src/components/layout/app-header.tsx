'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function AppHeader() {
  const t = useTranslations('common');
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mx-1 h-5" />
      </div>
      <div className="flex items-center gap-1">
        <LocaleSwitcher />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="size-9 text-muted-foreground hover:text-foreground"
              />
            }
          >
            <LogOut className="size-4" />
            <span className="sr-only">{t('logout')}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('logout')}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
