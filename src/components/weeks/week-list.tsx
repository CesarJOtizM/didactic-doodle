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
import { PrintRangeModal } from '@/components/weeks/print-range-modal';
import { changeWeekStatusAction } from '@/app/[locale]/(protected)/weeks/actions';
import type { MeetingWeek } from '@/generated/prisma/client';
import { WeekStatus } from '@/generated/prisma/enums';
import { cn } from '@/lib/utils';
import {
  PlusIcon,
  MoreHorizontalIcon,
  EyeIcon,
  CopyIcon,
  TrashIcon,
  SendIcon,
  UndoIcon,
  CalendarDaysIcon,
  PrinterIcon,
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
  const [printRangeOpen, setPrintRangeOpen] = useState(false);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <WeekFilters filters={filters} />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPrintRangeOpen(true)}
            className="h-10 shrink-0"
          >
            <PrinterIcon className="size-4" data-icon="inline-start" />
            {t('print.printRange')}
          </Button>
          <Button onClick={() => setFormOpen(true)} className="h-10 shrink-0">
            <PlusIcon className="size-4" data-icon="inline-start" />
            {t('actions.create')}
          </Button>
        </div>
      </div>

      {/* Table */}
      {weeks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <CalendarDaysIcon className="size-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-base font-medium text-foreground">
            {t('empty.noWeeks')}
          </p>
          <Button onClick={() => setFormOpen(true)} className="mt-4">
            <PlusIcon className="size-4" data-icon="inline-start" />
            {t('actions.create')}
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('fields.startDate')}
                </TableHead>
                <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('fields.weeklyReading')}
                </TableHead>
                <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('fields.status')}
                </TableHead>
                <TableHead className="h-10 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  #
                </TableHead>
                <TableHead className="h-10 w-12">
                  <span className="sr-only">{t('actions.edit')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeks.map((week, index) => (
                <TableRow
                  key={week.id}
                  className={cn(
                    'transition-colors hover:bg-muted/50',
                    isPending && 'opacity-60',
                    index % 2 === 0 && 'bg-muted/30'
                  )}
                >
                  <TableCell className="py-2.5">
                    <Link
                      href={`/weeks/${week.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {formatDateRange(week.fechaInicio, week.fechaFin)}
                    </Link>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className="text-sm text-muted-foreground">
                      {week.lecturaSemanal}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <WeekStatusBadge status={week.estado} />
                  </TableCell>
                  <TableCell className="py-2.5 text-right text-sm text-muted-foreground">
                    {week._count.parts}
                  </TableCell>
                  <TableCell className="py-2.5">
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
        </div>
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

      {/* Print Range Dialog */}
      <PrintRangeModal open={printRangeOpen} onOpenChange={setPrintRangeOpen} />
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
