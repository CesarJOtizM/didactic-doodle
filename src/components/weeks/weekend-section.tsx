'use client';

import { useState, useTransition } from 'react';
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
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  saveWeekendMeetingAction,
  getWeekendCandidatesAction,
  generateWeekendAssignmentsAction,
} from '@/app/[locale]/(protected)/weeks/actions';
import {
  SaveIcon,
  LoaderIcon,
  UserIcon,
  PencilIcon,
  XIcon,
  WandIcon,
} from 'lucide-react';

type WeekendMeetingData = {
  discursoTema: string | null;
  discursoOrador: string | null;
  presidente: { id: string; nombre: string } | null;
  conductor: { id: string; nombre: string } | null;
  lector: { id: string; nombre: string } | null;
  oracionInicial: { id: string; nombre: string } | null;
  oracionFinal: { id: string; nombre: string } | null;
};

type WeekendSectionProps = {
  weekId: string;
  weekendMeeting: WeekendMeetingData | null;
};

export function WeekendSection({
  weekId,
  weekendMeeting,
}: WeekendSectionProps) {
  const t = useTranslations('meetings');
  const tc = useTranslations('common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  // Form state
  const [discursoTema, setDiscursoTema] = useState(
    weekendMeeting?.discursoTema ?? ''
  );
  const [discursoOrador, setDiscursoOrador] = useState(
    weekendMeeting?.discursoOrador ?? ''
  );

  const handleSaveTexts = () => {
    startTransition(async () => {
      const result = await saveWeekendMeetingAction(weekId, {
        discursoTema: discursoTema || undefined,
        discursoOrador: discursoOrador || undefined,
      });
      if (result.success) {
        setEditing(false);
        router.refresh();
      }
    });
  };

  // Generate weekend assignments state
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<{
    filled: number;
    unfilled: number;
    skipped: number;
  } | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const handleRoleSelect = (
    role: 'presidente' | 'conductor' | 'lector' | 'oracionFinal',
    publisherId: string
  ) => {
    startTransition(async () => {
      const data: Record<string, string> = {};
      data[`${role}Id`] = publisherId;

      const result = await saveWeekendMeetingAction(weekId, data);
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleGenerateWeekend = (mode: 'partial' | 'full') => {
    setAssignmentError(null);
    setAssignmentResult(null);
    startTransition(async () => {
      const result = await generateWeekendAssignmentsAction(weekId, mode);
      if (result.success && result.data) {
        setAssignmentResult(result.data);
        setAssignmentError(null);
        setRegenerateOpen(false);
        router.refresh();
      } else if (!result.success) {
        setAssignmentError(result.error ?? 'Error');
        setRegenerateOpen(false);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('weekend.title')}
        </CardTitle>
        <CardAction>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleGenerateWeekend('partial')}
              disabled={isPending}
            >
              {isPending ? (
                <LoaderIcon
                  className="size-4 animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <WandIcon className="size-4" data-icon="inline-start" />
              )}
              {t('weekend.generate')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRegenerateOpen(true)}
              disabled={isPending}
            >
              <WandIcon className="size-4" data-icon="inline-start" />
              {t('weekend.regenerateAll')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(!editing)}
            >
              <PencilIcon className="size-4" data-icon="inline-start" />
              {tc('edit')}
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Public Talk — text fields */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('weekend.publicTalk')}
          </h4>
          {editing ? (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t('weekend.talkTopic')}
                </label>
                <Input
                  value={discursoTema}
                  onChange={(e) => setDiscursoTema(e.target.value)}
                  placeholder={t('weekend.talkTopicPlaceholder')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t('weekend.talkSpeaker')}
                </label>
                <Input
                  value={discursoOrador}
                  onChange={(e) => setDiscursoOrador(e.target.value)}
                  placeholder={t('weekend.talkSpeakerPlaceholder')}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveTexts}
                  disabled={isPending}
                >
                  {isPending && (
                    <LoaderIcon
                      className="size-4 animate-spin"
                      data-icon="inline-start"
                    />
                  )}
                  <SaveIcon className="size-4" data-icon="inline-start" />
                  {tc('save')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  <XIcon className="size-4" data-icon="inline-start" />
                  {tc('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 rounded-lg bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('weekend.talkTopic')}
                </span>
                <span className="text-sm font-medium">
                  {weekendMeeting?.discursoTema || (
                    <span className="font-normal italic text-muted-foreground">
                      —
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('weekend.talkSpeaker')}
                </span>
                <span className="text-sm font-medium">
                  {weekendMeeting?.discursoOrador || (
                    <span className="font-normal italic text-muted-foreground">
                      —
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Weekend roles */}
        <div className="space-y-0.5">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('weekend.roles')}
          </h4>

          {/* Presidente */}
          <WeekendRoleRow
            label={t('weekend.presidente')}
            currentName={weekendMeeting?.presidente?.nombre ?? null}
            note={
              weekendMeeting?.presidente
                ? `(${t('weekend.givesOpeningPrayer')})`
                : undefined
            }
            role="presidente"
            onSelect={(id) => handleRoleSelect('presidente', id)}
            disabled={isPending}
          />

          {/* Oración inicial — auto (given by presidente) */}
          <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
            <span className="text-sm font-medium">
              {t('weekend.openingPrayer')}
            </span>
            <span className="text-sm italic text-muted-foreground">
              {weekendMeeting?.oracionInicial?.nombre ??
                t('weekend.givenByPresidente')}
            </span>
          </div>

          {/* Conductor de la Atalaya */}
          <WeekendRoleRow
            label={t('weekend.watchtowerConductor')}
            currentName={weekendMeeting?.conductor?.nombre ?? null}
            role="conductor"
            onSelect={(id) => handleRoleSelect('conductor', id)}
            disabled={isPending}
          />

          {/* Lector Atalaya */}
          <WeekendRoleRow
            label={t('weekend.watchtowerReader')}
            currentName={weekendMeeting?.lector?.nombre ?? null}
            role="lector"
            onSelect={(id) => handleRoleSelect('lector', id)}
            disabled={isPending}
          />

          {/* Oración final */}
          <WeekendRoleRow
            label={t('weekend.closingPrayer')}
            currentName={weekendMeeting?.oracionFinal?.nombre ?? null}
            role="oracionFinal"
            onSelect={(id) => handleRoleSelect('oracionFinal', id)}
            disabled={isPending}
          />
        </div>

        {/* Assignment result banner */}
        {assignmentResult && (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950">
            <p className="text-sm text-green-800 dark:text-green-200">
              {t('assignments.stats', assignmentResult)}
            </p>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setAssignmentResult(null)}
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>
        )}

        {/* Assignment error banner */}
        {assignmentError && (
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{assignmentError}</p>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setAssignmentError(null)}
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>
        )}
      </CardContent>

      {/* Regenerate confirmation dialog */}
      <Dialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('weekend.confirmRegenerateTitle')}</DialogTitle>
            <DialogDescription>
              {t('weekend.confirmRegenerate')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegenerateOpen(false)}
              disabled={isPending}
            >
              {tc('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleGenerateWeekend('full')}
              disabled={isPending}
            >
              {isPending && (
                <LoaderIcon
                  className="size-4 animate-spin"
                  data-icon="inline-start"
                />
              )}
              {t('weekend.regenerateAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Role Row with Selector ──────────────────────────────────────────

function WeekendRoleRow({
  label,
  currentName,
  note,
  role,
  onSelect,
  disabled,
}: {
  label: string;
  currentName: string | null;
  note?: string;
  role: 'presidente' | 'conductor' | 'lector' | 'oracionFinal';
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
        const result = await getWeekendCandidatesAction(role);
        if (result.success && result.data) {
          setCandidates(result.data);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        {note && <span className="text-xs text-muted-foreground">{note}</span>}
      </div>
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
    </div>
  );
}
