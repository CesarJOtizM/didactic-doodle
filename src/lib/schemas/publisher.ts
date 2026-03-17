import { z } from 'zod';
import { Gender, Role, PublisherStatus } from '@/generated/prisma/enums';

// Extract enum values as tuples for Zod v4
const genderValues = Object.values(Gender) as [Gender, ...Gender[]];
const roleValues = Object.values(Role) as [Role, ...Role[]];
const statusValues = Object.values(PublisherStatus) as [
  PublisherStatus,
  ...PublisherStatus[],
];

// Roles allowed for female publishers
const FEMALE_ALLOWED_ROLES: Role[] = [
  Role.BAPTIZED_PUBLISHER,
  Role.UNBAPTIZED_PUBLISHER,
];

// Base schema for publisher fields (without cross-field refinements)
export const publisherBaseSchema = z.object({
  nombre: z.string().min(1, 'Name is required').max(200),
  sexo: z.enum(genderValues),
  rol: z.enum(roleValues),
  estado: z.enum(statusValues).default(PublisherStatus.ACTIVE),
  fechaFinAusencia: z.coerce.date().nullable().optional(),
  habilitadoVMC: z.boolean().default(true),
  habilitadoAcomodador: z.boolean().default(false),
  habilitadoMicrofono: z.boolean().default(false),
  skipAssignment: z.boolean().default(false),
  observaciones: z.string().max(1000).nullable().optional(),
});

// Create schema with cross-field refinements
export const createPublisherSchema = publisherBaseSchema
  .refine(
    (data) => {
      if (data.sexo === Gender.FEMALE) {
        return FEMALE_ALLOWED_ROLES.includes(data.rol);
      }
      return true;
    },
    {
      message: 'Women can only be Baptized Publisher or Unbaptized Publisher',
      path: ['rol'],
    }
  )
  .refine(
    (data) => {
      if (data.fechaFinAusencia && data.estado !== PublisherStatus.ABSENT) {
        return false;
      }
      return true;
    },
    {
      message: 'End of absence date is only valid when status is ABSENT',
      path: ['fechaFinAusencia'],
    }
  );

// Update schema — all fields optional, same refinements
export const updatePublisherSchema = publisherBaseSchema
  .partial()
  .refine(
    (data) => {
      if (
        data.sexo !== undefined &&
        data.rol !== undefined &&
        data.sexo === Gender.FEMALE
      ) {
        return FEMALE_ALLOWED_ROLES.includes(data.rol);
      }
      return true;
    },
    {
      message: 'Women can only be Baptized Publisher or Unbaptized Publisher',
      path: ['rol'],
    }
  )
  .refine(
    (data) => {
      if (data.fechaFinAusencia && data.estado !== PublisherStatus.ABSENT) {
        return false;
      }
      return true;
    },
    {
      message: 'End of absence date is only valid when status is ABSENT',
      path: ['fechaFinAusencia'],
    }
  );

// Filter schema for list queries — parses URL search params
export const publisherFilterSchema = z.object({
  search: z.string().optional(),
  sexo: z.enum(genderValues).optional(),
  rol: z.enum(roleValues).optional(),
  estado: z.enum(statusValues).optional(),
  habilitadoVMC: z.coerce.boolean().optional(),
  habilitadoAcomodador: z.coerce.boolean().optional(),
  habilitadoMicrofono: z.coerce.boolean().optional(),
  sortBy: z
    .enum(['nombre', 'ultimaAsignacion', 'totalAsignaciones'])
    .default('nombre'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// Type exports
export type CreatePublisherInput = z.infer<typeof createPublisherSchema>;
export type UpdatePublisherInput = z.infer<typeof updatePublisherSchema>;
export type PublisherFilters = z.infer<typeof publisherFilterSchema>;
