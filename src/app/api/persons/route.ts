import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const persons = await prisma.person.findMany({
    include: {
      eligibilities: { include: { assignment: true } },
      assignments: { include: { assignment: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(persons);
}

export async function POST(request: Request) {
  const body = await request.json();
  const person = await prisma.person.create({
    data: {
      name: body.name,
      email: body.email,
    },
  });
  return NextResponse.json(person, { status: 201 });
}
