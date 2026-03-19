import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Disconnect and clear the cached Prisma client.
 *
 * Use this after replacing the database file so the next query
 * creates a fresh libsql connection to the new file.
 */
export async function resetPrisma(): Promise<void> {
  await prisma.$disconnect();
  // Clear the cached instance so a fresh client is created on next import.
  // Note: the module-level `prisma` export still references the old instance,
  // but after $disconnect + clearing globalThis, the next hot-reload in dev
  // will create a new client. For the current process, Prisma will
  // re-establish the connection on the next query via the same instance.
  globalForPrisma.prisma = undefined;
}
