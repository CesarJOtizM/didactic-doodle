'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  generateAttendantsAction,
  clearAttendantsAction,
  overrideAttendantAction,
  getAttendantCandidatesAction,
  getWeekAttendantsAction,
} from '@/app/[locale]/(protected)/weeks/actions';
import { cn } from '@/lib/utils';
import { WandIcon, LoaderIcon, TrashIcon, UserIcon } from 'lucide-react';

type AttendantSlotData = {
  attendantRole: string;
  publisherId: string;
  publisherNombre: string;
};

type AttendantSectionProps = {
  weekId: string;
  meetingType: 'MIDWEEK' | 'WEEKEND';
  title: string;
};

const ATTENDANT_ROLES = [
  'DOORMAN',
  'ATTENDANT',
  'MICROPHONE_1',
  'MICROPHONE_2',
] as const;

export function AttendantSection({
  weekId,
  meetingType,
  title,
}: AttendantSectionProps) {
  const t = useTranslations('meetings');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [attendants, setAttendants] = useState<AttendantSlotData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load attendants on mount
  useEffect(() => {
    async function load() {
      const result = await getWeekAttendantsAction(weekId, meetingType);
      if (result.success && result.data) {
        setAttendants(result.data);
      }
      setLoading(false);
    }
    load();
  }, [weekId, meetingType]);

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateAttendantsAction(weekId, meetingType);
      if (result.success) {
        // Reload attendants
        const updated = await getWeekAttendantsAction(weekId, meetingType);
        if (updated.success && updated.data) {
          setAttendants(updated.data);
        }
        toast.success(
          result.data
            ? `Acomodadores generados: ${result.data.filled} asignados`
            : 'Acomodadores generados'
        );
        router.refresh();
      } else {
        toast.error(result.error ?? 'Error al generar acomodadores');
      }
    });
  };

  const handleClear = () => {
    startTransition(async () => {
      const result = await clearAttendantsAction(weekId, meetingType);
      if (result.success) {
        setAttendants([]);
        toast.success('Acomodadores eliminados');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Error al limpiar acomodadores');
      }
    });
  };

  const handleOverride = (role: string, publisherId: string) => {
    startTransition(async () => {
      const result = await overrideAttendantAction(
        weekId,
        meetingType,
        role,
        publisherId
      );
      if (result.success) {
        const updated = await getWeekAttendantsAction(weekId, meetingType);
        if (updated.success && updated.data) {
          setAttendants(updated.data);
        }
        router.refresh();
      }
    });
  };

  const getAttendantForRole = (role: string): AttendantSlotData | undefined => {
    return attendants.find((a) => a.attendantRole === role);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 py-6">
            <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {t('override.loading')}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        <CardAction>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleGenerate} disabled={isPending}>
              {isPending ? (
                <LoaderIcon
                  className="size-4 animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <WandIcon className="size-4" data-icon="inline-start" />
              )}
              {t('attendants.generate')}
            </Button>
            {attendants.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isPending}
              >
                <TrashIcon className="size-4" data-icon="inline-start" />
                {t('attendants.clear')}
              </Button>
            )}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-0.5">
        {ATTENDANT_ROLES.map((role, index) => {
          const attendant = getAttendantForRole(role);

          return (
            <div
              key={role}
              className={cn(
                'flex items-center justify-between rounded-md px-3 py-2.5 transition-colors hover:bg-muted/50',
                index % 2 === 0 && 'bg-muted/30'
              )}
            >
              <span className="text-sm font-medium">
                {t(`attendants.roles.${role}`)}
              </span>
              <AttendantRoleSelector
                role={role}
                currentName={attendant?.publisherNombre ?? null}
                onSelect={(publisherId) => handleOverride(role, publisherId)}
                disabled={isPending}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Role Selector ───────────────────────────────────────────────────

function AttendantRoleSelector({
  role,
  currentName,
  onSelect,
  disabled,
}: {
  role: string;
  currentName: string | null;
  onSelect: (publisherId: string) => void;
  disabled: boolean;
}) {
  const t = useTranslations('meetings');
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      try {
        const result = await getAttendantCandidatesAction(role);
        if (result.success && result.data) {
          setCandidates(result.data);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger
        className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-sm hover:bg-muted/80 transition-colors"
        disabled={disabled}
      >
        <UserIcon className="size-3 text-muted-foreground" />
        <span className={currentName ? '' : 'italic text-muted-foreground'}>
          {currentName ?? t('unassigned')}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
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
            {!loading && (
              <>
                <CommandEmpty>{t('override.noCandidates')}</CommandEmpty>
                <CommandGroup>
                  {candidates.map((candidate) => (
                    <CommandItem
                      key={candidate.id}
                      value={candidate.nombre}
                      onSelect={() => {
                        onSelect(candidate.id);
                        setOpen(false);
                      }}
                    >
                      {candidate.nombre}
                    </CommandItem>
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
