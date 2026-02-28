import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Distributes assignments equitably among eligible persons.
 *
 * Algorithm:
 * 1. For each assignment, get the list of eligible persons.
 * 2. Sort eligible persons by their current assignment count (ascending)
 *    so the person with the fewest assignments gets the next one.
 * 3. Assign to the person with the fewest current assignments.
 *
 * POST /api/assignments/distribute
 * Clears existing results and redistributes all assignments.
 */
export async function POST() {
  // Clear previous distribution
  await prisma.assignmentResult.deleteMany();

  const assignments = await prisma.assignment.findMany({
    include: {
      eligibilities: { include: { person: true } },
    },
  });

  // Track how many assignments each person has received
  const personAssignmentCount: Record<number, number> = {};

  const results: { assignmentId: number; personId: number }[] = [];

  for (const assignment of assignments) {
    const eligiblePersonIds = assignment.eligibilities.map((e) => e.personId);

    if (eligiblePersonIds.length === 0) continue;

    // Initialize counts for eligible persons
    for (const pid of eligiblePersonIds) {
      if (!(pid in personAssignmentCount)) {
        personAssignmentCount[pid] = 0;
      }
    }

    // Pick the eligible person with the fewest assignments
    eligiblePersonIds.sort(
      (a, b) => (personAssignmentCount[a] ?? 0) - (personAssignmentCount[b] ?? 0)
    );

    const selectedPersonId = eligiblePersonIds[0];
    personAssignmentCount[selectedPersonId]++;

    results.push({
      assignmentId: assignment.id,
      personId: selectedPersonId,
    });
  }

  // Bulk create all assignment results
  if (results.length > 0) {
    await prisma.assignmentResult.createMany({ data: results });
  }

  const created = await prisma.assignmentResult.findMany({
    include: {
      person: true,
      assignment: true,
    },
  });

  return NextResponse.json({
    message: `Distributed ${created.length} assignments`,
    results: created,
  });
}
