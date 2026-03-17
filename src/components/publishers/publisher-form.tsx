'use client';

import { useState, useTransition, useEffect } from 'react';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('editPublisher') : t('createPublisher')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('editPublisher') : t('createPublisher')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General error */}
          {generalError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {generalError}
            </div>
          )}

          {/* Nombre */}
          <div className="space-y-1.5">
            <label htmlFor="nombre" className="text-sm font-medium">
              {t('form.name')} *
            </label>
            <Input
              id="nombre"
              name="nombre"
              required
              defaultValue={publisher?.nombre ?? ''}
              placeholder={t('form.namePlaceholder')}
              aria-invalid={!!fieldErrors.nombre}
            />
            {fieldErrors.nombre && (
              <p className="text-xs text-destructive">
                {fieldErrors.nombre[0]}
              </p>
            )}
          </div>

          {/* Sexo */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.gender')} *</label>
            <Select
              name="sexo"
              value={sexo}
              onValueChange={handleSexoChange}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue />
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
              <p className="text-xs text-destructive">{fieldErrors.sexo[0]}</p>
            )}
          </div>

          {/* Rol */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.role')} *</label>
            <Select
              name="rol"
              value={rol}
              onValueChange={(val) => val && setRol(val as Role)}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue />
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
              <p className="text-xs text-destructive">{fieldErrors.rol[0]}</p>
            )}
          </div>

          {/* Estado (only when editing) */}
          {isEditing && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('form.status')}</label>
              <Select
                name="estado"
                value={estado}
                onValueChange={(val) =>
                  val && setEstado(val as PublisherStatus)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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
          )}

          {/* Fecha fin ausencia (only when ABSENT) */}
          {estado === PublisherStatus.ABSENT && (
            <div className="space-y-1.5">
              <label htmlFor="fechaFinAusencia" className="text-sm font-medium">
                {t('form.absenceEndDate')}
              </label>
              <Input
                id="fechaFinAusencia"
                name="fechaFinAusencia"
                type="date"
                defaultValue={
                  publisher?.fechaFinAusencia
                    ? new Date(publisher.fechaFinAusencia)
                        .toISOString()
                        .split('T')[0]
                    : ''
                }
              />
              {fieldErrors.fechaFinAusencia && (
                <p className="text-xs text-destructive">
                  {fieldErrors.fechaFinAusencia[0]}
                </p>
              )}
            </div>
          )}

          {/* Boolean toggles */}
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="habilitadoVMC"
                defaultChecked={publisher?.habilitadoVMC ?? true}
                className="size-4 rounded border-input"
              />
              <span className="text-sm">{t('form.vmcEnabled')}</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="habilitadoAcomodador"
                defaultChecked={publisher?.habilitadoAcomodador ?? false}
                className="size-4 rounded border-input"
              />
              <span className="text-sm">{t('form.attendantEnabled')}</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="habilitadoMicrofono"
                defaultChecked={publisher?.habilitadoMicrofono ?? false}
                className="size-4 rounded border-input"
              />
              <span className="text-sm">{t('form.microphoneEnabled')}</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="skipAssignment"
                defaultChecked={publisher?.skipAssignment ?? false}
                className="size-4 rounded border-input"
              />
              <span className="text-sm">{t('form.skipAssignment')}</span>
            </label>
          </div>

          {/* Observaciones */}
          <div className="space-y-1.5">
            <label htmlFor="observaciones" className="text-sm font-medium">
              {t('form.observations')}
            </label>
            <Textarea
              id="observaciones"
              name="observaciones"
              defaultValue={publisher?.observaciones ?? ''}
              placeholder={t('form.observationsPlaceholder')}
              rows={3}
            />
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
