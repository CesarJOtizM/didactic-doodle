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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

export function AppSidebar() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <span className="text-lg font-semibold">{t('common.appName')}</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
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
                    >
                      <Icon className="size-4" />
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
