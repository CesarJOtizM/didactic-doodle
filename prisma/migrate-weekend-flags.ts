/**
 * Data migration: Set habilitadoPresidenciaFinDeSemana = true
 * for all publishers with rol ELDER or MINISTERIAL_SERVANT.
 *
 * Run with: npx tsx prisma/migrate-weekend-flags.ts
 */
import 'dotenv/config';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

async function migrateWeekendFlags() {
  const result = await prisma.publisher.updateMany({
    where: {
      rol: { in: ['ELDER', 'MINISTERIAL_SERVANT'] },
      deletedAt: null,
    },
    data: {
      habilitadoPresidenciaFinDeSemana: true,
    },
  });

  console.log(
    `Migration complete: ${result.count} publishers updated with habilitadoPresidenciaFinDeSemana = true`
  );
}

migrateWeekendFlags()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Migration failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
