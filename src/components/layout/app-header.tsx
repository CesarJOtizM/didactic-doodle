'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
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
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon' }),
              'size-9 text-muted-foreground hover:text-foreground'
            )}
            onClick={handleLogout}
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
