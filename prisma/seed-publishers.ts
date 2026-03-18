import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../src/generated/prisma/client';
import * as fs from 'fs';
import * as path from 'path';

interface PublisherData {
  nombre: string;
  sexo: 'MALE' | 'FEMALE';
  rol: 'ELDER' | 'MINISTERIAL_SERVANT' | 'BAPTIZED_PUBLISHER' | 'UNBAPTIZED_PUBLISHER';
  estado: 'ACTIVE' | 'ABSENT' | 'RESTRICTED' | 'INACTIVE';
  fechaFinAusencia: string | null;
  habilitadoVMC: boolean;
  habilitadoOracion: boolean;
  habilitadoLectura: boolean;
  habilitadoAcomodador: boolean;
  habilitadoMicrofono: boolean;
  skipAssignment: boolean;
  observaciones: string | null;
  deletedAt: string | null;
}

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

async function seedPublishers() {
  const jsonPath = path.resolve(__dirname, '..', 'nombres_con_permisos_completos.json');
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const publishers: PublisherData[] = JSON.parse(raw);

  console.log(`Seeding ${publishers.length} publishers...`);

  let created = 0;
  let updated = 0;

  for (const p of publishers) {
    const data = {
      nombre: p.nombre,
      sexo: p.sexo,
      rol: p.rol,
      estado: p.estado,
      fechaFinAusencia: p.fechaFinAusencia ? new Date(p.fechaFinAusencia) : null,
      habilitadoVMC: p.habilitadoVMC,
      habilitadoOracion: p.habilitadoOracion,
      habilitadoLectura: p.habilitadoLectura,
      habilitadoAcomodador: p.habilitadoAcomodador,
      habilitadoMicrofono: p.habilitadoMicrofono,
      skipAssignment: p.skipAssignment,
      observaciones: p.observaciones,
      deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
    };

    const existing = await prisma.publisher.findFirst({
      where: { nombre: p.nombre },
    });

    if (existing) {
      await prisma.publisher.update({
        where: { id: existing.id },
        data,
      });
      updated++;
    } else {
      await prisma.publisher.create({ data });
      created++;
    }
  }

  console.log(`Seed completed: ${created} created, ${updated} updated`);
}

seedPublishers()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
