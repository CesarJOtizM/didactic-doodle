import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const assignments = await prisma.assignment.findMany({
    include: {
      eligibilities: { include: { person: true } },
      results: { include: { person: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(assignments);
}

export async function POST(request: Request) {
  const body = await request.json();
  const assignment = await prisma.assignment.create({
    data: {
      name: body.name,
      description: body.description,
      eligibilities: body.eligiblePersonIds
        ? {
            create: body.eligiblePersonIds.map((personId: number) => ({
              personId,
            })),
          }
        : undefined,
    },
    include: {
      eligibilities: { include: { person: true } },
    },
  });
  return NextResponse.json(assignment, { status: 201 });
}
