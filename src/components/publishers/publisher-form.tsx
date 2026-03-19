'use client';

import { useState, useTransition, useEffect } from 'react';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  createPublisherAction,
  updatePublisherAction,
} from '@/app/[locale]/(protected)/publishers/actions';
import { Gender, Role, PublisherStatus } from '@/generated/prisma/enums';
import { isEligibleRole } from '@/lib/publisher-utils';
import type { Publisher } from '@/generated/prisma/client';
import type { ActionResult } from '@/lib/types';
import { LoaderIcon } from 'lucide-react';

type PublisherFormProps = {
  publisher: Publisher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PublisherForm({
  publisher,
  open,
  onOpenChange,
}: PublisherFormProps) {
  const t = useTranslations('publishers');
  const tc = useTranslations('common');
  const isEditing = publisher !== null;
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Form field states
  const [sexo, setSexo] = useState<Gender>(Gender.MALE);
  const [rol, setRol] = useState<Role>(Role.BAPTIZED_PUBLISHER);
  const [estado, setEstado] = useState<PublisherStatus>(PublisherStatus.ACTIVE);

  // Reset form when dialog opens or publisher changes
  useEffect(() => {
    if (open) {
      setFieldErrors({});
      setGeneralError(null);
      if (publisher) {
        setSexo(publisher.sexo);
        setRol(publisher.rol);
        setEstado(publisher.estado);
      } else {
        setSexo(Gender.MALE);
        setRol(Role.BAPTIZED_PUBLISHER);
        setEstado(PublisherStatus.ACTIVE);
      }
    }
  }, [open, publisher]);

  // Filter roles based on gender
  const availableRoles = Object.values(Role).filter((r) =>
    isEligibleRole(sexo, r)
  );

  // When gender changes, reset role if current role is invalid
  const handleSexoChange = (newSexo: string | null) => {
    if (!newSexo) return;
    const gender = newSexo as Gender;
    setSexo(gender);
    if (!isEligibleRole(gender, rol)) {
      setRol(Role.BAPTIZED_PUBLISHER);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      let result: ActionResult<Publisher>;
      if (isEditing) {
        result = await updatePublisherAction(publisher.id, null, formData);
      } else {
        result = await createPublisherAction(null, formData);
      }

      if (result.success) {
        toast.success(
          isEditing ? 'Publicador actualizado' : 'Publicador creado'
        );
        onOpenChange(false);
      } else {
        setGeneralError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toast.error(result.error ?? 'Error al guardar publicador');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('editPublisher') : t('createPublisher')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('editPublisher')
              : t('empty.noPublishersDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* General error */}
          {generalError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <span className="shrink-0">!</span>
              <span>{generalError}</span>
            </div>
          )}

          {/* Nombre */}
          <div className="space-y-2">
            <label
              htmlFor="nombre"
              className="text-sm font-medium leading-none"
            >
              {t('form.name')} <span className="text-destructive">*</span>
            </label>
            <Input
              id="nombre"
              name="nombre"
              required
              defaultValue={publisher?.nombre ?? ''}
              placeholder={t('form.namePlaceholder')}
              aria-invalid={!!fieldErrors.nombre}
              className="h-10"
            />
            {fieldErrors.nombre && (
              <p className="text-xs text-destructive" role="alert">
                {fieldErrors.nombre[0]}
              </p>
            )}
          </div>

          {/* Gender + Role row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Sexo */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                {t('form.gender')} <span className="text-destructive">*</span>
              </label>
              <Select
                name="sexo"
                value={sexo}
                onValueChange={handleSexoChange}
                required
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue>
                    {(value: string) => t(`gender.${value}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Gender).map((g) => (
                    <SelectItem key={g} value={g}>
                      {t(`gender.${g}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.sexo && (
                <p className="text-xs text-destructive" role="alert">
                  {fieldErrors.sexo[0]}
                </p>
              )}
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                {t('form.role')} <span className="text-destructive">*</span>
              </label>
              <Select
                name="rol"
                value={rol}
                onValueChange={(val) => val && setRol(val as Role)}
                required
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue>
                    {(value: string) => t(`role.${value}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`role.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.rol && (
                <p className="text-xs text-destructive" role="alert">
                  {fieldErrors.rol[0]}
                </p>
              )}
            </div>
          </div>

          {/* Estado section (only when editing) */}
          {isEditing && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('form.status')}
              </p>
              <div className="space-y-2">
                <Select
                  name="estado"
                  value={estado}
                  onValueChange={(val) =>
                    val && setEstado(val as PublisherStatus)
                  }
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue>
                      {(value: string) => t(`status.${value}`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PublisherStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`status.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha fin ausencia (only when ABSENT) */}
              {estado === PublisherStatus.ABSENT && (
                <div className="space-y-2">
                  <label
                    htmlFor="fechaFinAusencia"
                    className="text-sm font-medium leading-none"
                  >
                    {t('form.absenceEndDate')}
                  </label>
                  <Input
                    id="fechaFinAusencia"
                    name="fechaFinAusencia"
                    type="date"
                    className="h-10"
                    defaultValue={
                      publisher?.fechaFinAusencia
                        ? new Date(publisher.fechaFinAusencia)
                            .toISOString()
                            .split('T')[0]
                        : ''
                    }
                  />
                  {fieldErrors.fechaFinAusencia && (
                    <p className="text-xs text-destructive" role="alert">
                      {fieldErrors.fechaFinAusencia[0]}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Boolean toggles */}
          <fieldset className="space-y-1">
            <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('table.vmcEnabled')} / {t('table.attendantEnabled')}
            </legend>
            <div className="space-y-0">
              <label className="flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 transition-colors hover:bg-muted/50">
                <input
                  type="checkbox"
                  name="habilitadoVMC"
                  defaultChecked={publisher?.habilitadoVMC ?? true}
                  className="size-4 shrink-0 rounded border-input accent-primary"
                />
                <span className="text-sm">{t('form.vmcEnabled')}</span>
              </label>

              <label className="flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 transition-colors hover:bg-muted/50">
                <input
                  type="checkbox"
                  name="habilitadoOracion"
                  defaultChecked={publisher?.habilitadoOracion ?? false}
                  className="size-4 shrink-0 rounded border-input accent-primary"
                />
                <span className="text-sm">{t('form.prayerEnabled')}</span>
              </label>

              <label className="flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 transition-colors hover:bg-muted/50">
                <input
                  type="checkbox"
                  name="habilitadoLectura"
                  defaultChecked={publisher?.habilitadoLectura ?? false}
                  className="size-4 shrink-0 rounded border-input accent-primary"
                />
                <span className="text-sm">{t('form.readerEnabled')}</span>
              </label>

              <label className="flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 transition-colors hover:bg-muted/50">
                <input
                  type="checkbox"
                  name="habilitadoAcomodador"
                  defaultChecked={publisher?.habilitadoAcomodador ?? false}
                  className="size-4 shrink-0 rounded border-input accent-primary"
                />
                <span className="text-sm">{t('form.attendantEnabled')}</span>
              </label>

              <label className="flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 transition-colors hover:bg-muted/50">
                <input
                  type="checkbox"
                  name="habilitadoMicrofono"
                  defaultChecked={publisher?.habilitadoMicrofono ?? false}
                  className="size-4 shrink-0 rounded border-input accent-primary"
                />
                <span className="text-sm">{t('form.microphoneEnabled')}</span>
              </label>

              <label className="flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 transition-colors hover:bg-muted/50">
                <input
                  type="checkbox"
                  name="habilitadoPresidenciaFinDeSemana"
                  defaultChecked={
                    publisher?.habilitadoPresidenciaFinDeSemana ?? false
                  }
                  className="size-4 shrink-0 rounded border-input accent-primary"
                />
                <span className="text-sm">
                  {t('form.weekendPresidencyEnabled')}
                </span>
              </label>

              <label className="flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 transition-colors hover:bg-muted/50">
                <input
                  type="checkbox"
                  name="habilitadoConductorAtalaya"
                  defaultChecked={
                    publisher?.habilitadoConductorAtalaya ?? false
                  }
                  className="size-4 shrink-0 rounded border-input accent-primary"
                />
                <span className="text-sm">
                  {t('form.watchtowerConductorEnabled')}
                </span>
              </label>

              <label className="flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 transition-colors hover:bg-muted/50">
                <input
                  type="checkbox"
                  name="skipAssignment"
                  defaultChecked={publisher?.skipAssignment ?? false}
                  className="size-4 shrink-0 rounded border-input accent-primary"
                />
                <span className="text-sm">{t('form.skipAssignment')}</span>
              </label>
            </div>
          </fieldset>

          {/* Observaciones */}
          <div className="space-y-2">
            <label
              htmlFor="observaciones"
              className="text-sm font-medium leading-none"
            >
              {t('form.observations')}
            </label>
            <Textarea
              id="observaciones"
              name="observaciones"
              defaultValue={publisher?.observaciones ?? ''}
              placeholder={t('form.observationsPlaceholder')}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {t('form.observationsPlaceholder')}
            </p>
          </div>

          {/* Footer */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {tc('cancel')}
            </Button>
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
