import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const COLUMNS_FILE = path.join(process.cwd(), "data", "kanban-columns.json");
const DEFAULT_COLUMNS = [
  { id: "todo", title: "À faire", status: "todo" },
  { id: "in_progress", title: "En cours", status: "in_progress" },
  { id: "done", title: "Terminé", status: "done" },
];

async function readColumns() {
  try {
    const file = await fs.readFile(COLUMNS_FILE, "utf-8");
    return JSON.parse(file);
  } catch {
    return DEFAULT_COLUMNS;
  }
}

async function writeColumns(columns: any[]) {
  await fs.mkdir(path.dirname(COLUMNS_FILE), { recursive: true });
  await fs.writeFile(COLUMNS_FILE, JSON.stringify(columns, null, 2), "utf-8");
}

export async function GET() {
  const columns = await readColumns();
  return NextResponse.json(columns);
}

export async function PUT(req: NextRequest) {
  const columns = await req.json();
  await writeColumns(columns);
  return NextResponse.json({ ok: true });
}
