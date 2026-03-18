'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrashIcon } from 'lucide-react';

export type NVCPartFormData = {
  titulo: string;
  duracion: number;
};

type NVCPartFormProps = {
  index: number;
  value: NVCPartFormData;
  onChange: (index: number, data: NVCPartFormData) => void;
  onRemove?: (index: number) => void;
  canRemove: boolean;
  errors?: Record<string, string[]>;
};

export function NVCPartForm({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
  errors = {},
}: NVCPartFormProps) {
  const t = useTranslations('meetings');

  const handleChange = (field: keyof NVCPartFormData, val: unknown) => {
    onChange(index, { ...value, [field]: val });
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div
      className={cn(
        'space-y-1 rounded-lg border bg-background p-3',
        hasErrors ? 'border-destructive' : 'border-border'
      )}
    >
      <div className="flex items-start gap-2">
        {/* Title */}
        <div className="flex-1 space-y-1">
          <Input
            placeholder={t('smm.partTitle')}
            value={value.titulo}
            onChange={(e) => handleChange('titulo', e.target.value)}
            aria-invalid={!!errors.titulo}
          />
          {errors.titulo && (
            <p className="text-xs text-destructive">{errors.titulo[0]}</p>
          )}
        </div>

        {/* Duration */}
        <div className="w-20 space-y-1">
          <Input
            type="number"
            min={1}
            max={30}
            placeholder={t('smm.duration')}
            value={value.duracion || ''}
            onChange={(e) =>
              handleChange('duracion', parseInt(e.target.value) || 0)
            }
            aria-invalid={!!errors.duracion}
          />
          {errors.duracion && (
            <p className="text-xs text-destructive">{errors.duracion[0]}</p>
          )}
        </div>

        {/* Remove */}
        {canRemove && onRemove && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemove(index)}
            className="mt-0.5"
          >
            <TrashIcon className="size-3.5 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}
