'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SMMPartForm, type SMMPartFormData } from './smm-part-form';
import { NVCPartForm, type NVCPartFormData } from './nvc-part-form';
import { createWeekAction } from '@/app/[locale]/(protected)/weeks/actions';
import { LoaderIcon, PlusIcon } from 'lucide-react';

type WeekFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DEFAULT_SMM_PART: SMMPartFormData = {
  titulo: '',
  tipo: 'DEMONSTRATION',
  duracion: 4,
  requiereAyudante: true,
};

const DEFAULT_NVC_PART: NVCPartFormData = {
  titulo: '',
  duracion: 15,
};

export function WeekForm({ open, onOpenChange }: WeekFormProps) {
  const t = useTranslations('meetings');
  const tc = useTranslations('common');
  const [isPending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Form state
  const [fechaInicio, setFechaInicio] = useState('');
  const [lecturaSemanal, setLecturaSemanal] = useState('');
  const [cancionApertura, setCancionApertura] = useState<number>(0);
  const [cancionIntermedia, setCancionIntermedia] = useState<number>(0);
  const [cancionCierre, setCancionCierre] = useState<number>(0);
  const [salaAuxiliarActiva, setSalaAuxiliarActiva] = useState(false);

  // Dynamic parts
  const [smmParts, setSmmParts] = useState<SMMPartFormData[]>([
    { ...DEFAULT_SMM_PART },
    { ...DEFAULT_SMM_PART },
    { ...DEFAULT_SMM_PART },
  ]);
  const [nvcParts, setNvcParts] = useState<NVCPartFormData[]>([
    { ...DEFAULT_NVC_PART },
  ]);

  const handleSMMChange = (index: number, data: SMMPartFormData) => {
    const updated = [...smmParts];
    updated[index] = data;
    setSmmParts(updated);
  };

  const handleSMMRemove = (index: number) => {
    if (smmParts.length <= 3) return;
    setSmmParts(smmParts.filter((_, i) => i !== index));
  };

  const handleSMMAdd = () => {
    if (smmParts.length >= 7) return;
    setSmmParts([...smmParts, { ...DEFAULT_SMM_PART }]);
  };

  const handleNVCChange = (index: number, data: NVCPartFormData) => {
    const updated = [...nvcParts];
    updated[index] = data;
    setNvcParts(updated);
  };

  const handleNVCRemove = (index: number) => {
    if (nvcParts.length <= 1) return;
    setNvcParts(nvcParts.filter((_, i) => i !== index));
  };

  const handleNVCAdd = () => {
    if (nvcParts.length >= 2) return;
    setNvcParts([...nvcParts, { ...DEFAULT_NVC_PART }]);
  };

  const resetForm = () => {
    setFechaInicio('');
    setLecturaSemanal('');
    setCancionApertura(0);
    setCancionIntermedia(0);
    setCancionCierre(0);
    setSalaAuxiliarActiva(false);
    setSmmParts([
      { ...DEFAULT_SMM_PART },
      { ...DEFAULT_SMM_PART },
      { ...DEFAULT_SMM_PART },
    ]);
    setNvcParts([{ ...DEFAULT_NVC_PART }]);
    setGeneralError(null);
    setFieldErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const payload = {
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      lecturaSemanal,
      cancionApertura,
      cancionIntermedia,
      cancionCierre,
      salaAuxiliarActiva,
      smmParts,
      nvcParts,
    };

    startTransition(async () => {
      const result = await createWeekAction(payload);
      if (result.success) {
        resetForm();
        onOpenChange(false);
      } else {
        setGeneralError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('createWeek')}</DialogTitle>
          <DialogDescription>{t('createWeekDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* General error */}
          {generalError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {generalError}
            </div>
          )}

          {/* Start date */}
          <div className="space-y-1.5">
            <label htmlFor="fechaInicio" className="text-sm font-medium">
              {t('fields.startDate')} *
            </label>
            <Input
              id="fechaInicio"
              type="date"
              required
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              aria-invalid={!!fieldErrors.fechaInicio}
            />
            {fieldErrors.fechaInicio && (
              <p className="text-xs text-destructive">
                {fieldErrors.fechaInicio[0]}
              </p>
            )}
          </div>

          {/* Weekly reading */}
          <div className="space-y-1.5">
            <label htmlFor="lecturaSemanal" className="text-sm font-medium">
              {t('fields.weeklyReading')} *
            </label>
            <Input
              id="lecturaSemanal"
              required
              value={lecturaSemanal}
              onChange={(e) => setLecturaSemanal(e.target.value)}
              aria-invalid={!!fieldErrors.lecturaSemanal}
            />
            {fieldErrors.lecturaSemanal && (
              <p className="text-xs text-destructive">
                {fieldErrors.lecturaSemanal[0]}
              </p>
            )}
          </div>

          {/* Songs — 3 in a row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="cancionApertura" className="text-sm font-medium">
                {t('fields.openingSong')} *
              </label>
              <Input
                id="cancionApertura"
                type="number"
                min={1}
                max={151}
                required
                value={cancionApertura || ''}
                onChange={(e) =>
                  setCancionApertura(parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="cancionIntermedia"
                className="text-sm font-medium"
              >
                {t('fields.middleSong')} *
              </label>
              <Input
                id="cancionIntermedia"
                type="number"
                min={1}
                max={151}
                required
                value={cancionIntermedia || ''}
                onChange={(e) =>
                  setCancionIntermedia(parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cancionCierre" className="text-sm font-medium">
                {t('fields.closingSong')} *
              </label>
              <Input
                id="cancionCierre"
                type="number"
                min={1}
                max={151}
                required
                value={cancionCierre || ''}
                onChange={(e) =>
                  setCancionCierre(parseInt(e.target.value) || 0)
                }
              />
            </div>
          </div>

          {/* Auxiliary room toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={salaAuxiliarActiva}
              onChange={(e) => setSalaAuxiliarActiva(e.target.checked)}
              className="size-4 rounded border-input"
            />
            <span className="text-sm font-medium">
              {t('fields.auxiliaryRoom')}
            </span>
          </label>

          {/* SMM Parts */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('smm.smmParts')}
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSMMAdd}
                disabled={smmParts.length >= 7}
              >
                <PlusIcon className="size-3.5" data-icon="inline-start" />
                {t('smm.addSMMPart')}
              </Button>
            </div>
            {smmParts.map((part, i) => (
              <SMMPartForm
                key={i}
                index={i}
                value={part}
                onChange={handleSMMChange}
                onRemove={handleSMMRemove}
                canRemove={smmParts.length > 3}
              />
            ))}
          </div>

          {/* NVC Parts */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('nvc.nvcParts')}
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNVCAdd}
                disabled={nvcParts.length >= 2}
              >
                <PlusIcon className="size-3.5" data-icon="inline-start" />
                {t('nvc.addNVCPart')}
              </Button>
            </div>
            {nvcParts.map((part, i) => (
              <NVCPartForm
                key={i}
                index={i}
                value={part}
                onChange={handleNVCChange}
                onRemove={handleNVCRemove}
                canRemove={nvcParts.length > 1}
              />
            ))}
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <LoaderIcon
                  className="size-4 animate-spin"
                  data-icon="inline-start"
                />
              )}
              {tc('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
