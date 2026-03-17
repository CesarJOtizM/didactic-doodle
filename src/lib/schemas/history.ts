import { z } from 'zod';
import { PartType, Section } from '@/generated/prisma/enums';

const partTypeValues = Object.values(PartType) as [PartType, ...PartType[]];
const sectionValues = Object.values(Section) as [Section, ...Section[]];

export const historyFilterSchema = z.object({
  search: z.string().optional(),
  tipo: z.enum(partTypeValues).optional(),
  seccion: z.enum(sectionValues).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  tab: z.enum(['history', 'metrics', 'last-assignment']).default('history'),
  months: z.coerce.number().int().positive().default(3),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type HistoryFilters = z.infer<typeof historyFilterSchema>;
