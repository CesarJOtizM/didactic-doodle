'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const { theme, setTheme } = useTheme();
  const t = useTranslations('common');

  const current = (theme ?? 'system') as (typeof themeOrder)[number];
  const currentIndex = themeOrder.indexOf(current);
  const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
  const Icon = themeIcons[current] ?? Monitor;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(nextTheme)}
            className="text-muted-foreground hover:text-foreground"
          />
        }
      >
        <Icon className="size-4" />
        <span className="sr-only">{t(`theme.${current}`)}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{t(`theme.${current}`)}</TooltipContent>
    </Tooltip>
  );
}
