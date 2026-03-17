'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WeekFilters } from '@/components/weeks/week-filters';
import { WeekPagination } from '@/components/weeks/week-pagination';
import { WeekStatusBadge } from '@/components/weeks/week-status-badge';
import { WeekForm } from '@/components/weeks/week-form';
import { WeekDeleteDialog } from '@/components/weeks/week-delete-dialog';
import { WeekDuplicateDialog } from '@/components/weeks/week-duplicate-dialog';
import { changeWeekStatusAction } from '@/app/[locale]/(protected)/weeks/actions';
import type { MeetingWeek } from '@/generated/prisma/client';
import { WeekStatus } from '@/generated/prisma/enums';
import {
  PlusIcon,
  MoreHorizontalIcon,
  EyeIcon,
  CopyIcon,
  TrashIcon,
  SendIcon,
  UndoIcon,
} from 'lucide-react';

type WeekWithCount = MeetingWeek & { _count: { parts: number } };

type WeekListProps = {
  weeks: WeekWithCount[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: {
    status?: string;
    page?: number;
    pageSize?: number;
  };
};

export function WeekList({
  weeks,
  total,
  page,
  pageSize,
  totalPages,
  filters,
}: WeekListProps) {
  const t = useTranslations('meetings');
  const tc = useTranslations('common');
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [deleteWeekId, setDeleteWeekId] = useState<string | null>(null);
  const [duplicateWeekId, setDuplicateWeekId] = useState<string | null>(null);

  const handleStatusChange = (weekId: string, newStatus: WeekStatus) => {
    startTransition(async () => {
      await changeWeekStatusAction(weekId, newStatus);
    });
  };

  const formatDateRange = (start: Date, end: Date) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString()} – ${e.toLocaleDateString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: filters + create button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <WeekFilters filters={filters} />
        <Button onClick={() => setFormOpen(true)}>
          <PlusIcon className="size-4" data-icon="inline-start" />
          {t('actions.create')}
        </Button>
      </div>

      {/* Table */}
      {weeks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            {t('empty.noWeeks')}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('fields.startDate')}</TableHead>
              <TableHead>{t('fields.weeklyReading')}</TableHead>
              <TableHead>{t('status.DRAFT')}</TableHead>
              <TableHead className="text-right">#</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">{t('actions.edit')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeks.map((week) => (
              <TableRow key={week.id} className={isPending ? 'opacity-60' : ''}>
                <TableCell>
                  <Link
                    href={`/weeks/${week.id}`}
                    className="font-medium hover:underline"
                  >
                    {formatDateRange(week.fechaInicio, week.fechaFin)}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{week.lecturaSemanal}</span>
                </TableCell>
                <TableCell>
                  <WeekStatusBadge status={week.estado} />
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {week._count.parts}
                </TableCell>
                <TableCell>
                  <RowActions
                    week={week}
                    t={t}
                    tc={tc}
                    onDelete={setDeleteWeekId}
                    onDuplicate={setDuplicateWeekId}
                    onStatusChange={handleStatusChange}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      <WeekPagination
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
      />

      {/* Create Dialog */}
      <WeekForm open={formOpen} onOpenChange={setFormOpen} />

      {/* Delete Dialog */}
      <WeekDeleteDialog
        weekId={deleteWeekId}
        open={deleteWeekId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteWeekId(null);
        }}
      />

      {/* Duplicate Dialog */}
      <WeekDuplicateDialog
        sourceId={duplicateWeekId}
        open={duplicateWeekId !== null}
        onOpenChange={(open) => {
          if (!open) setDuplicateWeekId(null);
        }}
      />
    </div>
  );
}

// ─── Row Actions Dropdown ────────────────────────────────────────────

type RowActionsProps = {
  week: WeekWithCount;
  t: ReturnType<typeof useTranslations<'meetings'>>;
  tc: ReturnType<typeof useTranslations<'common'>>;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onStatusChange: (id: string, newStatus: WeekStatus) => void;
};

function RowActions({
  week,
  t,
  tc,
  onDelete,
  onDuplicate,
  onStatusChange,
}: RowActionsProps) {
  const isDraft = week.estado === WeekStatus.DRAFT;
  const isAssigned = week.estado === WeekStatus.ASSIGNED;
  const isPublished = week.estado === WeekStatus.PUBLISHED;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <MoreHorizontalIcon className="size-4" />
        <span className="sr-only">{t('actions.edit')}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* View Detail */}
        <DropdownMenuItem render={<Link href={`/weeks/${week.id}`} />}>
          <EyeIcon className="size-4" />
          {t('actions.edit')}
        </DropdownMenuItem>

        {/* Duplicate */}
        <DropdownMenuItem onClick={() => onDuplicate(week.id)}>
          <CopyIcon className="size-4" />
          {t('actions.duplicate')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Status actions */}
        {isAssigned && (
          <DropdownMenuItem
            onClick={() => onStatusChange(week.id, WeekStatus.PUBLISHED)}
          >
            <SendIcon className="size-4" />
            {t('actions.publish')}
          </DropdownMenuItem>
        )}

        {isPublished && (
          <DropdownMenuItem
            onClick={() => onStatusChange(week.id, WeekStatus.ASSIGNED)}
          >
            <UndoIcon className="size-4" />
            {t('actions.unpublish')}
          </DropdownMenuItem>
        )}

        {/* Delete — only DRAFT */}
        {isDraft && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(week.id)}
            >
              <TrashIcon className="size-4" />
              {tc('delete')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
