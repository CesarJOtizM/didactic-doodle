'use server';

import { revalidatePath } from 'next/cache';
import {
  createPublisherSchema,
  updatePublisherSchema,
} from '@/lib/schemas/publisher';
import {
  createPublisher,
  updatePublisher,
  softDeletePublisher,
  reactivatePublisher,
  changePublisherStatus,
} from '@/data/publishers';
import { PublisherStatus } from '@/generated/prisma/enums';
import type { Publisher } from '@/generated/prisma/client';
import type { ActionResult } from '@/lib/types';

function parseFormDataToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};

  obj.nombre = formData.get('nombre') as string;
  obj.sexo = formData.get('sexo') as string;
  obj.rol = formData.get('rol') as string;

  const estado = formData.get('estado') as string | null;
  if (estado) obj.estado = estado;

  const fechaFinAusencia = formData.get('fechaFinAusencia') as string | null;
  if (fechaFinAusencia) {
    obj.fechaFinAusencia = new Date(fechaFinAusencia);
  } else {
    obj.fechaFinAusencia = null;
  }

  // Checkboxes: present in formData = true, absent = false
  obj.habilitadoVMC = formData.get('habilitadoVMC') === 'on';
  obj.habilitadoOracion = formData.get('habilitadoOracion') === 'on';
  obj.habilitadoLectura = formData.get('habilitadoLectura') === 'on';
  obj.habilitadoAcomodador = formData.get('habilitadoAcomodador') === 'on';
  obj.habilitadoMicrofono = formData.get('habilitadoMicrofono') === 'on';
  obj.skipAssignment = formData.get('skipAssignment') === 'on';

  const observaciones = formData.get('observaciones') as string | null;
  obj.observaciones = observaciones || null;

  return obj;
}

function formatZodErrors(
  issues: { path: PropertyKey[]; message: string }[]
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.');
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

export async function createPublisherAction(
  _prevState: ActionResult<Publisher> | null,
  formData: FormData
): Promise<ActionResult<Publisher>> {
  try {
    const raw = parseFormDataToObject(formData);
    const result = createPublisherSchema.safeParse(raw);

    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: formatZodErrors(result.error.issues),
      };
    }

    const publisher = await createPublisher(result.data);
    revalidatePath('/[locale]/publishers', 'page');
    return { success: true, data: publisher };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create publisher',
    };
  }
}

export async function updatePublisherAction(
  id: string,
  _prevState: ActionResult<Publisher> | null,
  formData: FormData
): Promise<ActionResult<Publisher>> {
  try {
    const raw = parseFormDataToObject(formData);
    const result = updatePublisherSchema.safeParse(raw);

    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: formatZodErrors(result.error.issues),
      };
    }

    const publisher = await updatePublisher(id, result.data);
    revalidatePath('/[locale]/publishers', 'page');
    return { success: true, data: publisher };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update publisher',
    };
  }
}

export async function deletePublisherAction(id: string): Promise<ActionResult> {
  try {
    await softDeletePublisher(id);
    revalidatePath('/[locale]/publishers', 'page');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete publisher',
    };
  }
}

export async function reactivatePublisherAction(
  id: string
): Promise<ActionResult> {
  try {
    await reactivatePublisher(id);
    revalidatePath('/[locale]/publishers', 'page');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to reactivate publisher',
    };
  }
}

export async function changeStatusAction(
  id: string,
  status: string,
  fechaFinAusencia?: string
): Promise<ActionResult> {
  try {
    const newStatus = status as PublisherStatus;
    const validStatuses = Object.values(PublisherStatus);
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: `Invalid status: ${status}` };
    }

    const date = fechaFinAusencia ? new Date(fechaFinAusencia) : null;
    await changePublisherStatus(id, newStatus, date);
    revalidatePath('/[locale]/publishers', 'page');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to change publisher status',
    };
  }
}
