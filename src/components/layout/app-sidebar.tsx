'use client';

import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  Clock,
  Shield,
  Settings,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

const iconMap = {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  Clock,
  Shield,
  Settings,
} as const;

/** First group: main navigation items (dashboard, publishers, meetings, history, attendants) */
const MAIN_NAV = NAV_ITEMS.filter((item) => item.icon !== 'Settings');
/** Second group: settings/admin items */
const SETTINGS_NAV = NAV_ITEMS.filter((item) => item.icon === 'Settings');

export function AppSidebar() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <Sidebar>
      {/* ── Brand header ─────────────────────────────── */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarDays className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              {t('common.appName')}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('common.subtitle')}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* ── Main navigation ────────────────────────── */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('nav.dashboard')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {MAIN_NAV.map((item) => {
                const Icon =
                  iconMap[item.icon as keyof typeof iconMap] || LayoutDashboard;
                const isActive =
                  item.route === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.route);

                return (
                  <SidebarMenuItem key={item.route}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.route} />}
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-primary font-semibold'
                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{t(item.labelKey)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ── Settings group ─────────────────────────── */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {SETTINGS_NAV.map((item) => {
                const Icon =
                  iconMap[item.icon as keyof typeof iconMap] || Settings;
                const isActive = pathname.startsWith(item.route);

                return (
                  <SidebarMenuItem key={item.route}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.route} />}
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-primary font-semibold'
                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{t(item.labelKey)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
