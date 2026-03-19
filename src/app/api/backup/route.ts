import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, copyFile, unlink, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { prisma, resetPrisma } from '@/data/prisma';

// ─── Constants ───────────────────────────────────────────────────────

const SQLITE_MAGIC = Buffer.from('SQLite format 3\0');
const MAX_UPLOAD_SIZE = 100 * 1024 * 1024; // 100 MB

/**
 * Resolve the SQLite database file path from DATABASE_URL.
 * Supports formats: "file:./prisma/dev.db" or "./prisma/dev.db"
 */
function getDbPath(): string {
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  const filePath = dbUrl.replace(/^file:/, '');
  return path.resolve(process.cwd(), filePath);
}

// ─── GET: Download database backup ──────────────────────────────────

export async function GET() {
  try {
    const dbPath = getDbPath();

    if (!existsSync(dbPath)) {
      return NextResponse.json(
        { error: 'Database file not found' },
        { status: 404 }
      );
    }

    // Flush WAL to main database file before reading.
    // This ensures the backup contains ALL committed data.
    try {
      await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE)');
    } catch {
      // Checkpoint failed — the .db file may be incomplete.
      // Check if a WAL file exists; if so, warn but continue.
      const walPath = `${dbPath}-wal`;
      if (existsSync(walPath)) {
        console.warn(
          '[backup] WAL checkpoint failed and WAL file exists. Backup may be incomplete.'
        );
      }
      // If there's no WAL file, the DB isn't in WAL mode — no issue.
    }

    const fileBuffer = await readFile(dbPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-vmc-${timestamp}.db`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Failed to download backup',
      },
      { status: 500 }
    );
  }
}

// ─── POST: Upload and restore database ──────────────────────────────

export async function POST(request: NextRequest) {
  const dbPath = getDbPath();
  const backupPath = `${dbPath}.bak`;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ── Size validation ──────────────────────────────────────────

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // ── Read & validate SQLite header ────────────────────────────

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 16 || !buffer.subarray(0, 16).equals(SQLITE_MAGIC)) {
      return NextResponse.json(
        { error: 'Invalid file: not a valid SQLite database' },
        { status: 400 }
      );
    }

    // ── Create safety backup of current DB ───────────────────────

    if (existsSync(dbPath)) {
      await copyFile(dbPath, backupPath);
    }

    // ── Disconnect Prisma before replacing the file ──────────────

    await resetPrisma();

    // ── Write the new database file ──────────────────────────────

    await writeFile(dbPath, buffer);

    // ── Validate schema ──────────────────────────────────────────
    // Try a basic query against a known table. If this fails,
    // the uploaded DB has an incompatible schema.

    try {
      await prisma.$queryRawUnsafe('SELECT count(*) as c FROM Publisher');
    } catch (schemaError) {
      // Schema validation failed — restore the original DB
      console.error('[backup] Schema validation failed:', schemaError);

      if (existsSync(backupPath)) {
        await copyFile(backupPath, dbPath);
        // Reconnect to the restored original
        await resetPrisma();
      }

      return NextResponse.json(
        {
          error: 'Invalid database schema: the uploaded file is not compatible',
        },
        { status: 400 }
      );
    }

    // ── Cleanup: remove safety backup ────────────────────────────

    try {
      if (existsSync(backupPath)) {
        await unlink(backupPath);
      }
    } catch {
      // Non-critical: .bak cleanup failed
    }

    // ── Get restored DB info ─────────────────────────────────────

    const dbStat = await stat(dbPath);

    return NextResponse.json({
      success: true,
      message: 'Database restored successfully',
      size: dbStat.size,
    });
  } catch (err) {
    // Attempt to restore from backup on unexpected errors
    try {
      if (existsSync(backupPath)) {
        await copyFile(backupPath, dbPath);
        await resetPrisma();
      }
    } catch {
      console.error('[backup] Failed to restore from safety backup');
    }

    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Failed to restore database',
      },
      { status: 500 }
    );
  }
}
