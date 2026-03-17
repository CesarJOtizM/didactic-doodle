'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getCandidatesForPartAction,
  overrideAssignmentAction,
} from '@/app/[locale]/(protected)/weeks/actions';
import type { ManualCandidate } from '@/lib/assignment-engine/types';
import { AlertTriangleIcon, BanIcon, LoaderIcon, UserIcon } from 'lucide-react';

type AssignmentSelectorProps = {
  partId: string;
  role: 'titular' | 'helper';
  currentName: string | null;
  disabled?: boolean;
};

export function AssignmentSelector({
  partId,
  role,
  currentName,
  disabled = false,
}: AssignmentSelectorProps) {
  const t = useTranslations('meetings');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<ManualCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      setError(null);
      try {
        const result = await getCandidatesForPartAction(partId, role);
        if (result.success && result.data) {
          setCandidates(result.data);
        } else {
          setError(result.success ? null : result.error);
        }
      } catch {
        setError(t('override.errorLoading'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelect = (candidateId: string) => {
    startTransition(async () => {
      const result = await overrideAssignmentAction(partId, role, candidateId);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const formatRelativeDate = (date: Date | null): string => {
    if (!date) return t('override.neverAssigned');
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    if (diffWeeks < 1) return '< 1 sem';
    if (diffWeeks === 1) return '1 sem';
    return `${diffWeeks} sem`;
  };

  if (disabled) {
    return (
      <span className="text-sm italic text-muted-foreground">
        {currentName ?? t('unassigned')}
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger
        className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-sm hover:bg-muted/80 transition-colors"
        disabled={isPending}
      >
        {isPending ? (
          <LoaderIcon className="size-3 animate-spin" />
        ) : (
          <UserIcon className="size-3 text-muted-foreground" />
        )}
        <span className={currentName ? '' : 'italic text-muted-foreground'}>
          {currentName ?? t('unassigned')}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder={t('override.searchCandidate')} />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center gap-2 py-6">
                <LoaderIcon className="size-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  {t('override.loading')}
                </span>
              </div>
            )}
            {error && (
              <div className="px-3 py-6 text-center text-sm text-destructive">
                {error}
              </div>
            )}
            {!loading && !error && (
              <>
                <CommandEmpty>{t('override.noCandidates')}</CommandEmpty>
                <CommandGroup>
                  {candidates.map((candidate) => (
                    <CandidateItem
                      key={candidate.id}
                      candidate={candidate}
                      onSelect={handleSelect}
                      formatRelativeDate={formatRelativeDate}
                    />
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Candidate Item ───────────────────────────────────────────────────

function CandidateItem({
  candidate,
  onSelect,
  formatRelativeDate,
}: {
  candidate: ManualCandidate;
  onSelect: (id: string) => void;
  formatRelativeDate: (date: Date | null) => string;
}) {
  const isBlocked = candidate.status === 'blocked';
  const hasWarnings = candidate.warnings.length > 0;

  return (
    <CommandItem
      value={candidate.nombre}
      disabled={isBlocked}
      onSelect={() => !isBlocked && onSelect(candidate.id)}
      className={isBlocked ? 'opacity-50' : ''}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate">{candidate.nombre}</span>
          {hasWarnings && !isBlocked && (
            <WarningIndicator warnings={candidate.warnings} />
          )}
          {isBlocked && candidate.blockReason && (
            <BlockIndicator reason={candidate.blockReason} />
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatRelativeDate(candidate.lastAssignmentDate)}
        </span>
      </div>
    </CommandItem>
  );
}

// ─── Warning/Block Indicators ─────────────────────────────────────────

function WarningIndicator({
  warnings,
}: {
  warnings: ManualCandidate['warnings'];
}) {
  const t = useTranslations('meetings.override');

  const WARNING_KEY_MAP: Record<string, string> = {
    duplicate_assignment: 'warnings.duplicateAssignment',
    room_conflict: 'warnings.roomConflict',
    skip_assignment: 'warnings.skipAssignment',
    has_observaciones: 'warnings.hasObservaciones',
  };

  const tooltipText = warnings
    .map((w) =>
      w.type === 'has_observaciones' && w.message
        ? w.message
        : t(WARNING_KEY_MAP[w.type] ?? w.type)
    )
    .join('\n');

  return (
    <Tooltip>
      <TooltipTrigger>
        <AlertTriangleIcon className="size-3.5 text-amber-500" />
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs whitespace-pre-line">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}

function BlockIndicator({ reason }: { reason: string }) {
  const t = useTranslations('meetings.override');

  const BLOCK_KEY_MAP: Record<string, string> = {
    'meetings.override.blocked.ineligible': 'blocked.ineligible',
    'meetings.override.blocked.exclusiveRole': 'blocked.exclusiveRole',
  };

  return (
    <Tooltip>
      <TooltipTrigger>
        <BanIcon className="size-3.5 text-destructive" />
      </TooltipTrigger>
      <TooltipContent side="right">
        {t(BLOCK_KEY_MAP[reason] ?? reason)}
      </TooltipContent>
    </Tooltip>
  );
}
