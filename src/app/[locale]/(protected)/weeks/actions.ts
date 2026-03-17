'use server';

import { revalidatePath } from 'next/cache';
import {
  createMeetingWeekSchema,
  updateMeetingWeekSchema,
  smmPartSchema,
  nvcPartSchema,
} from '@/lib/schemas/meeting-week';
import {
  createMeetingWeek,
  updateMeetingWeek,
  deleteMeetingWeek,
  duplicateMeetingWeek,
  changeWeekStatus,
  addSMMPart,
  updateSMMPart,
  removeSMMPart,
  addNVCPart,
  updateNVCPart,
  removeNVCPart,
  getMeetingWeekById,
} from '@/data/meeting-weeks';
import {
  getEligiblePublishers,
  getWeekParts,
  getRotationData,
  getExistingAssignments,
  saveAssignments,
  clearAssignments,
} from '@/data/assignments';
import { generateAssignments } from '@/lib/assignment-engine';
import { WeekStatus } from '@/generated/prisma/enums';
import type { ActionResult } from '@/lib/types';

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

// ─── Week CRUD Actions ───────────────────────────────────────────────

export async function createWeekAction(data: unknown): Promise<ActionResult> {
  try {
    const result = createMeetingWeekSchema.safeParse(data);

    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: formatZodErrors(result.error.issues),
      };
    }

    await createMeetingWeek(result.data);
    revalidatePath('/[locale]/weeks', 'page');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create week',
    };
  }
}

export async function updateWeekAction(
  id: string,
  data: unknown
): Promise<ActionResult> {
  try {
    const result = updateMeetingWeekSchema.safeParse(data);

    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: formatZodErrors(result.error.issues),
      };
    }

    await updateMeetingWeek(id, result.data);
    revalidatePath('/[locale]/weeks', 'page');
    revalidatePath(`/[locale]/weeks/${id}`, 'page');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update week',
    };
  }
}

export async function deleteWeekAction(id: string): Promise<ActionResult> {
  try {
    await deleteMeetingWeek(id);
    revalidatePath('/[locale]/weeks', 'page');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete week',
    };
  }
}

export async function duplicateWeekAction(
  sourceId: string,
  newFechaInicio: string
): Promise<ActionResult> {
  try {
    const date = new Date(newFechaInicio);
    if (isNaN(date.getTime())) {
      return { success: false, error: 'Invalid date' };
    }

    await duplicateMeetingWeek(sourceId, date);
    revalidatePath('/[locale]/weeks', 'page');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to duplicate week',
    };
  }
}

export async function changeWeekStatusAction(
  id: string,
  status: string
): Promise<ActionResult> {
  try {
    const validStatuses = Object.values(WeekStatus);
    if (!validStatuses.includes(status as WeekStatus)) {
      return { success: false, error: `Invalid status: ${status}` };
    }

    await changeWeekStatus(id, status as WeekStatus);
    revalidatePath('/[locale]/weeks', 'page');
    revalidatePath(`/[locale]/weeks/${id}`, 'page');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to change week status',
    };
  }
}

// ─── SMM Part Actions ────────────────────────────────────────────────

export async function addSMMPartAction(
  weekId: string,
  data: unknown
): Promise<ActionResult> {
  try {
    const result = smmPartSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: formatZodErrors(result.error.issues),
      };
    }

    await addSMMPart(weekId, result.data);
    revalidatePath(`/[locale]/weeks/${weekId}`, 'page');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add SMM part',
    };
  }
}

export async function updateSMMPartAction(
  partId: string,
  data: unknown
): Promise<ActionResult> {
  try {
    const result = smmPartSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: formatZodErrors(result.error.issues),
      };
    }

    const updated = await updateSMMPart(partId, result.data);
    revalidatePath(`/[locale]/weeks/${updated.meetingWeekId}`, 'page');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update SMM part',
    };
  }
}

export async function removeSMMPartAction(
  partId: string,
  weekId: string
): Promise<ActionResult> {
  try {
    await removeSMMPart(partId);
    revalidatePath(`/[locale]/weeks/${weekId}`, 'page');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to remove SMM part',
    };
  }
}

// ─── NVC Part Actions ────────────────────────────────────────────────

export async function addNVCPartAction(
  weekId: string,
  data: unknown
): Promise<ActionResult> {
  try {
    const result = nvcPartSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: formatZodErrors(result.error.issues),
      };
    }

    await addNVCPart(weekId, result.data);
    revalidatePath(`/[locale]/weeks/${weekId}`, 'page');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add NVC part',
    };
  }
}

export async function updateNVCPartAction(
  partId: string,
  data: unknown
): Promise<ActionResult> {
  try {
    const result = nvcPartSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: formatZodErrors(result.error.issues),
      };
    }

    const updated = await updateNVCPart(partId, result.data);
    revalidatePath(`/[locale]/weeks/${updated.meetingWeekId}`, 'page');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update NVC part',
    };
  }
}

export async function removeNVCPartAction(
  partId: string,
  weekId: string
): Promise<ActionResult> {
  try {
    await removeNVCPart(partId);
    revalidatePath(`/[locale]/weeks/${weekId}`, 'page');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to remove NVC part',
    };
  }
}

// ─── Assignment Engine Actions ───────────────────────────────────────

export async function generateAssignmentsAction(
  weekId: string,
  mode: 'partial' | 'full'
): Promise<
  ActionResult<{ filled: number; unfilled: number; skipped: number }>
> {
  try {
    // 1. Get week data
    const week = await getMeetingWeekById(weekId);
    if (!week) {
      return { success: false, error: 'Week not found' };
    }

    // 2. If full mode, clear existing assignments first
    if (mode === 'full') {
      await clearAssignments(weekId);
    }

    // 3. Gather engine inputs
    const [parts, publishers, rotationMap, existing] = await Promise.all([
      getWeekParts(weekId),
      getEligiblePublishers(),
      getRotationData(),
      mode === 'partial' ? getExistingAssignments(weekId) : Promise.resolve([]),
    ]);

    if (parts.length === 0) {
      return { success: false, error: 'No parts found for this week' };
    }

    // 4. Run engine
    const result = generateAssignments(
      parts,
      publishers,
      rotationMap,
      existing,
      {
        mode,
      }
    );

    // 5. Save results (only new assignments, not existing ones in partial mode)
    const assignmentsToSave =
      mode === 'partial'
        ? result.assignments.filter(
            (a) => !existing.some((e) => e.partId === a.partId)
          )
        : result.assignments;

    if (assignmentsToSave.length > 0) {
      await saveAssignments(weekId, assignmentsToSave, week.fechaInicio);
    } else if (mode === 'full') {
      // No assignments generated at all — still mark as ASSIGNED
      // (saveAssignments handles this, but we didn't call it)
      const { prisma: db } = await import('@/data/prisma');
      await db.meetingWeek.update({
        where: { id: weekId },
        data: { estado: 'ASSIGNED' },
      });
    }

    // 6. Revalidate
    revalidatePath('/[locale]/weeks', 'page');
    revalidatePath(`/[locale]/weeks/${weekId}`, 'page');

    // 7. Return stats
    return {
      success: true,
      data: {
        filled: result.stats.filled,
        unfilled: result.stats.unfilled,
        skipped: result.stats.skipped,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to generate assignments',
    };
  }
}
