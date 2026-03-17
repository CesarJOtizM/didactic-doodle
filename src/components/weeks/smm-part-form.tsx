'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrashIcon } from 'lucide-react';

export type SMMPartFormData = {
  titulo: string;
  tipo: 'DEMONSTRATION' | 'SPEECH';
  duracion: number;
  requiereAyudante: boolean;
};

type SMMPartFormProps = {
  index: number;
  value: SMMPartFormData;
  onChange: (index: number, data: SMMPartFormData) => void;
  onRemove?: (index: number) => void;
  canRemove: boolean;
};

export function SMMPartForm({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
}: SMMPartFormProps) {
  const t = useTranslations('meetings');

  const handleChange = (field: keyof SMMPartFormData, val: unknown) => {
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

      {/* Type */}
      <div className="w-36">
        <Select
          value={value.tipo}
          onValueChange={(val) => handleChange('tipo', val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(val: string) =>
                val === 'SPEECH' ? t('smm.speech') : t('smm.demonstration')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DEMONSTRATION">
              {t('smm.demonstration')}
            </SelectItem>
            <SelectItem value="SPEECH">{t('smm.speech')}</SelectItem>
          </SelectContent>
        </Select>
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

      {/* Requires helper */}
      <label className="flex items-center gap-1.5 pt-2">
        <input
          type="checkbox"
          checked={value.requiereAyudante}
          onChange={(e) => handleChange('requiereAyudante', e.target.checked)}
          className="size-4 rounded border-input"
        />
        <span className="text-xs whitespace-nowrap">
          {t('smm.requiresHelper')}
        </span>
      </label>

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
