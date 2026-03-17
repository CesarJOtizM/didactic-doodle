import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Resolve the SQLite database file path from DATABASE_URL.
 * Supports formats: "file:./prisma/dev.db" or "./prisma/dev.db"
 */
function getDbPath(): string {
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  const filePath = dbUrl.replace(/^file:/, '');
  return path.resolve(process.cwd(), filePath);
}

// ─── SQLite magic bytes ──────────────────────────────────────────────

const SQLITE_MAGIC = Buffer.from('SQLite format 3\0');

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
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read the uploaded file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate SQLite file header
    if (buffer.length < 16 || !buffer.subarray(0, 16).equals(SQLITE_MAGIC)) {
      return NextResponse.json(
        { error: 'Invalid file: not a valid SQLite database' },
        { status: 400 }
      );
    }

    const dbPath = getDbPath();

    // Create a backup of the current database before replacing
    if (existsSync(dbPath)) {
      const backupPath = `${dbPath}.bak`;
      await copyFile(dbPath, backupPath);
    }

    // Write the new database file
    await writeFile(dbPath, buffer);

    return NextResponse.json({
      success: true,
      message: 'Database restored successfully',
      size: buffer.length,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Failed to restore database',
      },
      { status: 500 }
    );
  }
}
