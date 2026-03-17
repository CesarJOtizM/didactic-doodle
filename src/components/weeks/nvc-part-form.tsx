'use client';

import { useTranslations } from 'next-intl';
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
};

export function NVCPartForm({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
}: NVCPartFormProps) {
  const t = useTranslations('meetings');

  const handleChange = (field: keyof NVCPartFormData, val: unknown) => {
    onChange(index, { ...value, [field]: val });
  };

  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-background p-3">
      {/* Title */}
      <div className="flex-1 space-y-1">
        <Input
          placeholder={t('smm.partTitle')}
          value={value.titulo}
          onChange={(e) => handleChange('titulo', e.target.value)}
        />
      </div>

      {/* Duration */}
      <div className="w-20">
        <Input
          type="number"
          min={1}
          max={30}
          placeholder={t('smm.duration')}
          value={value.duracion || ''}
          onChange={(e) =>
            handleChange('duracion', parseInt(e.target.value) || 0)
          }
        />
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
  );
}
