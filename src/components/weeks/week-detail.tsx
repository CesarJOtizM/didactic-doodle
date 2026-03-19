'use client';

import { useState, useTransition } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { WeekStatusBadge } from '@/components/weeks/week-status-badge';
import { WeekDeleteDialog } from '@/components/weeks/week-delete-dialog';
import { WeekDuplicateDialog } from '@/components/weeks/week-duplicate-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  updateWeekAction,
  changeWeekStatusAction,
  addSMMPartAction,
  removeSMMPartAction,
  addNVCPartAction,
  removeNVCPartAction,
  generateAssignmentsAction,
} from '@/app/[locale]/(protected)/weeks/actions';
import type { MeetingWeekWithParts } from '@/data/meeting-weeks';
import { WeekStatus, Section, Room } from '@/generated/prisma/enums';
import { AssignmentSelector } from '@/components/weeks/assignment-selector';
import { AttendantSection } from '@/components/weeks/attendant-section';
import { WeekendSection } from '@/components/weeks/weekend-section';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PencilIcon,
  TrashIcon,
  CopyIcon,
  SendIcon,
  UndoIcon,
  PlusIcon,
  SaveIcon,
  XIcon,
  LoaderIcon,
  WandIcon,
  PrinterIcon,
  MoreHorizontalIcon,
} from 'lucide-react';
import { useLocale } from 'next-intl';

/** Translate a part title if it's an i18n key, otherwise return as-is */
function getPartTitle(
  titulo: string | null,
  t: (key: string) => string
): string {
  if (!titulo) return '';
  if (titulo.startsWith('meetings.')) {
    try {
      return t(titulo.replace('meetings.', ''));
    } catch {
      return titulo;
    }
  }
  return titulo;
}

type WeekDetailProps = {
  week: MeetingWeekWithParts;
};

// Section display order and i18n keys
const SECTION_CONFIG = [
  { section: Section.OPENING, key: 'sections.opening' },
  { section: Section.TREASURES, key: 'sections.treasures' },
  { section: Section.MINISTRY_SCHOOL, key: 'sections.ministrySchool' },
  { section: Section.CHRISTIAN_LIFE, key: 'sections.christianLife' },
  { section: Section.CLOSING, key: 'sections.closing' },
] as const;

export function WeekDetail({ week }: WeekDetailProps) {
  const t = useTranslations('meetings');
  const tc = useTranslations('common');
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  // Edit mode for week fields
  const [editingFields, setEditingFields] = useState(false);
  const [lecturaSemanal, setLecturaSemanal] = useState(week.lecturaSemanal);
  const [cancionApertura, setCancionApertura] = useState(week.cancionApertura);
  const [cancionIntermedia, setCancionIntermedia] = useState(
    week.cancionIntermedia
  );
  const [cancionCierre, setCancionCierre] = useState(week.cancionCierre);
  const [salaAuxiliarActiva, setSalaAuxiliarActiva] = useState(
    week.salaAuxiliarActiva
  );

  // Tab state
  const [activeTab, setActiveTab] = useState('midweek');

  // Dialog states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);

  // Assignment generation state
  const [assignmentResult, setAssignmentResult] = useState<{
    filled: number;
    unfilled: number;
    skipped: number;
  } | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  // SMM inline add
  const [addingSMM, setAddingSMM] = useState(false);
  const [newSMMTitulo, setNewSMMTitulo] = useState('');
  const [newSMMTipo, setNewSMMTipo] = useState<'DEMONSTRATION' | 'SPEECH'>(
    'DEMONSTRATION'
  );
  const [newSMMDuracion, setNewSMMDuracion] = useState(4);
  const [newSMMHelper, setNewSMMHelper] = useState(true);

  // NVC inline add
  const [addingNVC, setAddingNVC] = useState(false);
  const [newNVCTitulo, setNewNVCTitulo] = useState('');
  const [newNVCDuracion, setNewNVCDuracion] = useState(15);

  const isDraft = week.estado === WeekStatus.DRAFT;
  const isAssigned = week.estado === WeekStatus.ASSIGNED;
  const isPublished = week.estado === WeekStatus.PUBLISHED;

  // Group parts by section
  const partsBySection = new Map<Section, MeetingWeekWithParts['parts']>();
  for (const section of Object.values(Section)) {
    partsBySection.set(
      section,
      week.parts.filter((p) => p.seccion === section)
    );
  }

  // Count SMM and NVC dynamic parts
  const smmMainParts = (
    partsBySection.get(Section.MINISTRY_SCHOOL) ?? []
  ).filter((p) => p.sala === Room.MAIN && p.orden > 1);
  const nvcDynamicParts = (
    partsBySection.get(Section.CHRISTIAN_LIFE) ?? []
  ).filter((p) => p.sala === Room.MAIN && p.orden < 100);

  const handleSaveFields = () => {
    startTransition(async () => {
      const result = await updateWeekAction(week.id, {
        lecturaSemanal,
        cancionApertura,
        cancionIntermedia,
        cancionCierre,
        salaAuxiliarActiva,
      });
      if (result.success) {
        setEditingFields(false);
        toast.success('Semana actualizada');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Error al actualizar la semana');
      }
    });
  };

  const handleStatusChange = (newStatus: WeekStatus) => {
    startTransition(async () => {
      const result = await changeWeekStatusAction(week.id, newStatus);
      if (result.success) {
        toast.success(
          newStatus === WeekStatus.PUBLISHED
            ? 'Semana publicada'
            : 'Semana despublicada'
        );
        router.refresh();
      } else {
        toast.error(result.error ?? 'Error al cambiar estado');
      }
    });
  };

  const handleAddSMM = () => {
    startTransition(async () => {
      const result = await addSMMPartAction(week.id, {
        titulo: newSMMTitulo,
        tipo: newSMMTipo,
        duracion: newSMMDuracion,
        requiereAyudante: newSMMHelper,
      });
      if (result.success) {
        setAddingSMM(false);
        setNewSMMTitulo('');
        setNewSMMDuracion(4);
        toast.success('Parte SMM agregada');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Error al agregar parte SMM');
      }
    });
  };

  const handleRemoveSMM = (partId: string) => {
    startTransition(async () => {
      const result = await removeSMMPartAction(partId, week.id);
      if (result.success) {
        toast.success('Parte SMM eliminada');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Error al eliminar parte SMM');
      }
    });
  };

  const handleAddNVC = () => {
    startTransition(async () => {
      const result = await addNVCPartAction(week.id, {
        titulo: newNVCTitulo,
        duracion: newNVCDuracion,
      });
      if (result.success) {
        setAddingNVC(false);
        setNewNVCTitulo('');
        setNewNVCDuracion(15);
        toast.success('Parte NVC agregada');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Error al agregar parte NVC');
      }
    });
  };

  const handleRemoveNVC = (partId: string) => {
    startTransition(async () => {
      const result = await removeNVCPartAction(partId, week.id);
      if (result.success) {
        toast.success('Parte NVC eliminada');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Error al eliminar parte NVC');
      }
    });
  };

  const handleGenerateAssignments = (mode: 'partial' | 'full') => {
    setAssignmentError(null);
    setAssignmentResult(null);
    startTransition(async () => {
      const result = await generateAssignmentsAction(week.id, mode);
      if (result.success && result.data) {
        setAssignmentResult(result.data);
        setAssignmentError(null);
        setRegenerateOpen(false);
        toast.success(
          `Asignaciones generadas: ${result.data.filled} asignadas, ${result.data.unfilled} sin asignar`
        );
        router.refresh();
      } else if (!result.success) {
        setAssignmentError(result.error ?? t('assignments.unknownError'));
        setRegenerateOpen(false);
        toast.error(result.error ?? 'Error al generar asignaciones');
      }
    });
  };

  return (
    <>
      {/* Week header card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">
              {new Date(week.fechaInicio).toLocaleDateString()} –{' '}
              {new Date(week.fechaFin).toLocaleDateString()}
            </CardTitle>
            <WeekStatusBadge status={week.estado} />
          </div>
          <CardAction>
            {/* ── Desktop: all buttons visible ── */}
            <div className="hidden flex-wrap items-center gap-2 sm:flex">
              {activeTab === 'midweek' && (
                <>
                  {isDraft && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingFields(!editingFields)}
                    >
                      <PencilIcon className="size-4" data-icon="inline-start" />
                      {tc('edit')}
                    </Button>
                  )}

                  {/* Assignment generation */}
                  {(isDraft || isAssigned) && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleGenerateAssignments(
                            isDraft ? 'full' : 'partial'
                          )
                        }
                        disabled={isPending}
                      >
                        {isPending ? (
                          <LoaderIcon
                            className="size-4 animate-spin"
                            data-icon="inline-start"
                          />
                        ) : (
                          <WandIcon
                            className="size-4"
                            data-icon="inline-start"
                          />
                        )}
                        {isDraft
                          ? t('assignments.generate')
                          : t('assignments.fillEmpty')}
                      </Button>
                      {isAssigned && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRegenerateOpen(true)}
                          disabled={isPending}
                        >
                          <WandIcon
                            className="size-4"
                            data-icon="inline-start"
                          />
                          {t('assignments.regenerateAll')}
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Status actions */}
              {isAssigned && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(WeekStatus.PUBLISHED)}
                  disabled={isPending}
                >
                  <SendIcon className="size-4" data-icon="inline-start" />
                  {t('actions.publish')}
                </Button>
              )}
              {isPublished && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(WeekStatus.ASSIGNED)}
                  disabled={isPending}
                >
                  <UndoIcon className="size-4" data-icon="inline-start" />
                  {t('actions.unpublish')}
                </Button>
              )}

              {/* Print buttons — context-aware per active tab */}
              {(isAssigned || isPublished) && activeTab === 'midweek' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `/${locale}/weeks/${week.id}/print/s140`,
                        '_blank'
                      )
                    }
                  >
                    <PrinterIcon className="size-4" data-icon="inline-start" />
                    {t('print.printS140')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `/${locale}/weeks/${week.id}/print/s89`,
                        '_blank'
                      )
                    }
                  >
                    <PrinterIcon className="size-4" data-icon="inline-start" />
                    {t('print.printS89')}
                  </Button>
                </>
              )}
              {(isAssigned || isPublished) && activeTab === 'weekend' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `/${locale}/weeks/${week.id}/print/weekend`,
                      '_blank'
                    )
                  }
                >
                  <PrinterIcon className="size-4" data-icon="inline-start" />
                  {t('print.printWeekend')}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setDuplicateOpen(true)}
              >
                <CopyIcon className="size-4" data-icon="inline-start" />
                {t('actions.duplicate')}
              </Button>

              {isDraft && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                >
                  <TrashIcon className="size-4" data-icon="inline-start" />
                  {tc('delete')}
                </Button>
              )}
            </div>

            {/* ── Mobile: primary actions + overflow dropdown ── */}
            <div className="flex items-center gap-2 sm:hidden">
              {/* Primary status action always visible */}
              {isAssigned && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(WeekStatus.PUBLISHED)}
                  disabled={isPending}
                >
                  <SendIcon className="size-4" data-icon="inline-start" />
                  {t('actions.publish')}
                </Button>
              )}
              {isPublished && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(WeekStatus.ASSIGNED)}
                  disabled={isPending}
                >
                  <UndoIcon className="size-4" data-icon="inline-start" />
                  {t('actions.unpublish')}
                </Button>
              )}

              {/* Assignment generation — primary action on midweek */}
              {activeTab === 'midweek' && (isDraft || isAssigned) && (
                <Button
                  size="sm"
                  onClick={() =>
                    handleGenerateAssignments(isDraft ? 'full' : 'partial')
                  }
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
                  {isDraft
                    ? t('assignments.generate')
                    : t('assignments.fillEmpty')}
                </Button>
              )}

              {/* Overflow dropdown for secondary actions */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'icon-sm' })
                  )}
                >
                  <MoreHorizontalIcon className="size-4" />
                  <span className="sr-only">{t('actions.moreActions')}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Edit (draft only, midweek tab) */}
                  {activeTab === 'midweek' && isDraft && (
                    <DropdownMenuItem
                      onClick={() => setEditingFields(!editingFields)}
                    >
                      <PencilIcon className="size-4" />
                      {tc('edit')}
                    </DropdownMenuItem>
                  )}

                  {/* Regenerate all (assigned only, midweek tab) */}
                  {activeTab === 'midweek' && isAssigned && (
                    <DropdownMenuItem onClick={() => setRegenerateOpen(true)}>
                      <WandIcon className="size-4" />
                      {t('assignments.regenerateAll')}
                    </DropdownMenuItem>
                  )}

                  {/* Print options */}
                  {(isAssigned || isPublished) && (
                    <>
                      <DropdownMenuSeparator />
                      {activeTab === 'midweek' && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(
                                `/${locale}/weeks/${week.id}/print/s140`,
                                '_blank'
                              )
                            }
                          >
                            <PrinterIcon className="size-4" />
                            {t('print.printS140')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(
                                `/${locale}/weeks/${week.id}/print/s89`,
                                '_blank'
                              )
                            }
                          >
                            <PrinterIcon className="size-4" />
                            {t('print.printS89')}
                          </DropdownMenuItem>
                        </>
                      )}
                      {activeTab === 'weekend' && (
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(
                              `/${locale}/weeks/${week.id}/print/weekend`,
                              '_blank'
                            )
                          }
                        >
                          <PrinterIcon className="size-4" />
                          {t('print.printWeekend')}
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  <DropdownMenuSeparator />

                  {/* Duplicate */}
                  <DropdownMenuItem onClick={() => setDuplicateOpen(true)}>
                    <CopyIcon className="size-4" />
                    {t('actions.duplicate')}
                  </DropdownMenuItem>

                  {/* Delete (draft only) */}
                  {isDraft && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteOpen(true)}
                      >
                        <TrashIcon className="size-4" />
                        {tc('delete')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardAction>
        </CardHeader>
        {activeTab === 'midweek' && (
          <CardContent>
            {editingFields ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {t('fields.weeklyReading')}
                  </label>
                  <Input
                    value={lecturaSemanal}
                    onChange={(e) => setLecturaSemanal(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {t('fields.openingSong')}
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={151}
                      value={cancionApertura}
                      onChange={(e) =>
                        setCancionApertura(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {t('fields.middleSong')}
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={151}
                      value={cancionIntermedia}
                      onChange={(e) =>
                        setCancionIntermedia(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {t('fields.closingSong')}
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={151}
                      value={cancionCierre}
                      onChange={(e) =>
                        setCancionCierre(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={salaAuxiliarActiva}
                    onCheckedChange={setSalaAuxiliarActiva}
                  />
                  <span className="text-sm">{t('fields.auxiliaryRoom')}</span>
                </label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveFields}
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
                    onClick={() => setEditingFields(false)}
                  >
                    <XIcon className="size-4" data-icon="inline-start" />
                    {tc('cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('fields.weeklyReading')}
                  </dt>
                  <dd className="mt-1">{week.lecturaSemanal}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('fields.openingSong')}
                  </dt>
                  <dd className="mt-1">{week.cancionApertura}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('fields.middleSong')}
                  </dt>
                  <dd className="mt-1">{week.cancionIntermedia}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('fields.closingSong')}
                  </dt>
                  <dd className="mt-1">{week.cancionCierre}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('fields.auxiliaryRoom')}
                  </dt>
                  <dd className="mt-1">
                    {week.salaAuxiliarActiva ? (
                      <Badge variant="secondary">ON</Badge>
                    ) : (
                      <span className="text-muted-foreground">OFF</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('fields.auxiliaryRoomStatus')}
                  </dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {week.parts.length} {t('fields.partsCount')}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        )}
      </Card>

      {/* Tabs: Midweek / Weekend */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as string)}
        className="w-full"
      >
        <TabsList variant="line" className="w-full border-b border-border">
          <TabsTrigger value="midweek">{t('tabs.midweek')}</TabsTrigger>
          <TabsTrigger value="weekend">{t('tabs.weekend')}</TabsTrigger>
        </TabsList>

        {/* ── Midweek tab ── */}
        <TabsContent value="midweek" className="w-full space-y-4 pt-4">
          {/* Meeting sections */}
          {SECTION_CONFIG.map(({ section, key }) => {
            const parts = partsBySection.get(section) ?? [];
            if (parts.length === 0) return null;

            const isSMM = section === Section.MINISTRY_SCHOOL;
            const isNVC = section === Section.CHRISTIAN_LIFE;

            return (
              <Card key={section}>
                <CardHeader>
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t(key)}
                  </CardTitle>
                  {isDraft && isSMM && smmMainParts.length < 7 && (
                    <CardAction>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddingSMM(true)}
                      >
                        <PlusIcon
                          className="size-3.5"
                          data-icon="inline-start"
                        />
                        {t('smm.addSMMPart')}
                      </Button>
                    </CardAction>
                  )}
                  {isDraft && isNVC && nvcDynamicParts.length < 6 && (
                    <CardAction>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddingNVC(true)}
                      >
                        <PlusIcon
                          className="size-3.5"
                          data-icon="inline-start"
                        />
                        {t('nvc.addNVCPart')}
                      </Button>
                    </CardAction>
                  )}
                </CardHeader>
                <CardContent className="space-y-0.5">
                  {parts.map((part) => {
                    const isSMMDynamic =
                      isSMM && part.orden > 1 && part.sala === Room.MAIN;
                    const isNVCDynamic =
                      isNVC && part.orden < 100 && part.sala === Room.MAIN;
                    const canRemoveSMM =
                      isSMMDynamic && smmMainParts.length > 3;
                    const canRemoveNVC = isNVCDynamic;

                    return (
                      <div
                        key={part.id}
                        className="flex flex-col gap-1 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/50 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4"
                      >
                        {/* Part title + badges */}
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0 sm:gap-2">
                          <span className="text-sm font-medium break-words">
                            {getPartTitle(part.titulo, t)}
                          </span>
                          {part.sala === Room.AUXILIARY_1 && (
                            <Badge
                              variant="outline"
                              className="shrink-0 text-xs"
                            >
                              AUX
                            </Badge>
                          )}
                          {part.duracion && (
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {part.duracion} min
                            </span>
                          )}
                          {part.requiereAyudante && (
                            <Badge
                              variant="secondary"
                              className="shrink-0 text-xs"
                            >
                              +{t('smm.requiresHelper')}
                            </Badge>
                          )}
                          {/* Remove button — inline with badges on mobile */}
                          {isDraft && canRemoveSMM && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="ml-auto sm:hidden"
                              onClick={() => handleRemoveSMM(part.id)}
                              disabled={isPending}
                            >
                              <TrashIcon className="size-3.5 text-destructive" />
                            </Button>
                          )}
                          {isDraft && canRemoveNVC && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="ml-auto sm:hidden"
                              onClick={() => handleRemoveNVC(part.id)}
                              disabled={isPending}
                            >
                              <TrashIcon className="size-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>

                        {/* Assignment display / selector */}
                        <div className="flex flex-wrap items-center gap-1">
                          {isAssigned || isPublished ? (
                            <>
                              <AssignmentSelector
                                partId={part.id}
                                role="titular"
                                currentName={
                                  part.assignment?.publisher.nombre ?? null
                                }
                              />
                              {part.requiereAyudante && (
                                <>
                                  <span className="text-xs text-muted-foreground">
                                    +
                                  </span>
                                  <AssignmentSelector
                                    partId={part.id}
                                    role="helper"
                                    currentName={
                                      part.assignment?.helper?.nombre ?? null
                                    }
                                  />
                                </>
                              )}
                            </>
                          ) : part.assignment ? (
                            <span className="text-sm">
                              {part.assignment.publisher.nombre}
                              {part.assignment.helper &&
                                ` + ${part.assignment.helper.nombre}`}
                            </span>
                          ) : (
                            <span className="text-sm italic text-muted-foreground">
                              {t('unassigned')}
                            </span>
                          )}
                        </div>

                        {/* Remove button for dynamic parts on DRAFT — desktop only */}
                        <div className="hidden sm:flex sm:items-center">
                          {isDraft && canRemoveSMM && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleRemoveSMM(part.id)}
                              disabled={isPending}
                            >
                              <TrashIcon className="size-3.5 text-destructive" />
                            </Button>
                          )}
                          {isDraft && canRemoveNVC && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleRemoveNVC(part.id)}
                              disabled={isPending}
                            >
                              <TrashIcon className="size-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Inline add SMM form */}
                  {isSMM && addingSMM && (
                    <>
                      <Separator />
                      <div className="space-y-2 rounded-md border p-3">
                        <p className="text-sm font-medium">
                          {t('smm.addSMMPart')}
                        </p>
                        <Input
                          placeholder={t('smm.partTitle')}
                          value={newSMMTitulo}
                          onChange={(e) => setNewSMMTitulo(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Select
                            value={newSMMTipo}
                            onValueChange={(val) =>
                              val &&
                              setNewSMMTipo(val as 'DEMONSTRATION' | 'SPEECH')
                            }
                          >
                            <SelectTrigger className="w-auto">
                              <SelectValue>
                                {newSMMTipo === 'DEMONSTRATION'
                                  ? t('smm.demonstration')
                                  : t('smm.speech')}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DEMONSTRATION">
                                {t('smm.demonstration')}
                              </SelectItem>
                              <SelectItem value="SPEECH">
                                {t('smm.speech')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            value={newSMMDuracion}
                            onChange={(e) =>
                              setNewSMMDuracion(parseInt(e.target.value) || 0)
                            }
                            className="w-20"
                          />
                          <label className="flex items-center gap-1.5">
                            <Switch
                              checked={newSMMHelper}
                              onCheckedChange={setNewSMMHelper}
                            />
                            <span className="text-xs">
                              {t('smm.requiresHelper')}
                            </span>
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleAddSMM}
                            disabled={isPending || !newSMMTitulo.trim()}
                          >
                            {isPending && (
                              <LoaderIcon className="size-3.5 animate-spin" />
                            )}
                            {tc('save')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAddingSMM(false)}
                          >
                            {tc('cancel')}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Inline add NVC form */}
                  {isNVC && addingNVC && (
                    <>
                      <Separator />
                      <div className="space-y-2 rounded-md border p-3">
                        <p className="text-sm font-medium">
                          {t('nvc.addNVCPart')}
                        </p>
                        <Input
                          placeholder={t('smm.partTitle')}
                          value={newNVCTitulo}
                          onChange={(e) => setNewNVCTitulo(e.target.value)}
                        />
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={newNVCDuracion}
                          onChange={(e) =>
                            setNewNVCDuracion(parseInt(e.target.value) || 0)
                          }
                          className="w-20"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleAddNVC}
                            disabled={isPending || !newNVCTitulo.trim()}
                          >
                            {isPending && (
                              <LoaderIcon className="size-3.5 animate-spin" />
                            )}
                            {tc('save')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAddingNVC(false)}
                          >
                            {tc('cancel')}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Midweek Attendants */}
          <AttendantSection
            weekId={week.id}
            meetingType="MIDWEEK"
            title={t('attendants.midweekTitle')}
          />
        </TabsContent>

        {/* ── Weekend tab ── */}
        <TabsContent value="weekend" className="w-full space-y-4 pt-4">
          {/* Weekend Meeting section */}
          <WeekendSection
            weekId={week.id}
            weekendMeeting={week.weekendMeeting ?? null}
          />

          {/* Weekend Attendants */}
          <AttendantSection
            weekId={week.id}
            meetingType="WEEKEND"
            title={t('attendants.weekendTitle')}
          />
        </TabsContent>
      </Tabs>

      {/* Assignment error banner (midweek only) */}
      {activeTab === 'midweek' && assignmentError && (
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

      {/* Assignment result banner (midweek only) */}
      {activeTab === 'midweek' && assignmentResult && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/20">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {t('assignments.stats', {
              filled: assignmentResult.filled,
              unfilled: assignmentResult.unfilled,
              skipped: assignmentResult.skipped,
            })}
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

      {/* Dialogs */}
      <WeekDeleteDialog
        weekId={week.id}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
      <WeekDuplicateDialog
        sourceId={week.id}
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
      />

      {/* Regenerate confirmation dialog */}
      <Dialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('assignments.confirmRegenerateTitle')}</DialogTitle>
            <DialogDescription>
              {t('assignments.confirmRegenerate')}
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
              onClick={() => handleGenerateAssignments('full')}
              disabled={isPending}
            >
              {isPending && (
                <LoaderIcon
                  className="size-4 animate-spin"
                  data-icon="inline-start"
                />
              )}
              {t('assignments.regenerateAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
