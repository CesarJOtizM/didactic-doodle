import { z } from 'zod';
import { WeekStatus } from '@/generated/prisma/enums';

// Extract enum values as tuple for Zod
const weekStatusValues = Object.values(WeekStatus) as [
  WeekStatus,
  ...WeekStatus[],
];

// ─── SMM Part Schema ─────────────────────────────────────────────────

export const smmPartSchema = z.object({
  titulo: z.string().min(1, 'Title is required').max(200),
  tipo: z.enum(['DEMONSTRATION', 'SPEECH']),
  duracion: z.number().int().positive().max(30),
  requiereAyudante: z.boolean().default(true),
});

// ─── NVC Part Schema ─────────────────────────────────────────────────

export const nvcPartSchema = z.object({
  titulo: z.string().min(1, 'Title is required').max(200),
  duracion: z.number().int().positive().max(30),
});

// ─── Create Meeting Week Schema ──────────────────────────────────────

export const createMeetingWeekSchema = z
  .object({
    fechaInicio: z.coerce.date(),
    lecturaSemanal: z.string().min(1, 'Weekly reading is required').max(200),
    cancionApertura: z.number().int().min(1).max(151),
    cancionIntermedia: z.number().int().min(1).max(151),
    cancionCierre: z.number().int().min(1).max(151),
    salaAuxiliarActiva: z.boolean().default(false),
    smmParts: z.array(smmPartSchema).min(3).max(7),
    nvcParts: z.array(nvcPartSchema).min(1).max(2),
  })
  .refine((data) => data.fechaInicio.getDay() === 1, {
    message: 'Start date must be a Monday',
    path: ['fechaInicio'],
  });

// ─── Update Meeting Week Schema ──────────────────────────────────────

export const updateMeetingWeekSchema = z
  .object({
    lecturaSemanal: z.string().min(1).max(200).optional(),
    cancionApertura: z.number().int().min(1).max(151).optional(),
    cancionIntermedia: z.number().int().min(1).max(151).optional(),
    cancionCierre: z.number().int().min(1).max(151).optional(),
    salaAuxiliarActiva: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided',
  });

// ─── Week Filter Schema ──────────────────────────────────────────────

export const meetingWeekFilterSchema = z.object({
  status: z.enum(weekStatusValues).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Type Exports ────────────────────────────────────────────────────

export type CreateMeetingWeekInput = z.infer<typeof createMeetingWeekSchema>;
export type UpdateMeetingWeekInput = z.infer<typeof updateMeetingWeekSchema>;
export type SMMPartInput = z.infer<typeof smmPartSchema>;
export type NVCPartInput = z.infer<typeof nvcPartSchema>;
export type MeetingWeekFilters = z.infer<typeof meetingWeekFilterSchema>;
