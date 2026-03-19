'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Sun, Moon, Monitor } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const themeOrder = ['light', 'dark', 'system'] as const;

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const t = useTranslations('common');

  useEffect(() => setMounted(true), []);

  const current = (theme ?? 'system') as (typeof themeOrder)[number];
  const currentIndex = themeOrder.indexOf(current);
  const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
  const Icon = themeIcons[current] ?? Monitor;
  const label = mounted ? t(`theme.${current}`) : t('theme.system');

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
          'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setTheme(nextTheme)}
      >
        {mounted ? <Icon className="size-4" /> : <Monitor className="size-4" />}
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
