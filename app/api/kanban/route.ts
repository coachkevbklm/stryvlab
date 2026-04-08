import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const TASKS_FILE = path.join(process.cwd(), "data", "kanban.json");
const DEFAULT_TASKS = [
  {
    id: "1",
    title: "Valider le bilan de Paul",
    status: "todo",
    priority: "high",
    dueDate: "2026-04-08",
  },
  {
    id: "2",
    title: "Relancer Julie (inactif)",
    status: "in_progress",
    priority: "medium",
    dueDate: "2026-04-09",
  },
  { id: "3", title: "Programmer séance Luc", status: "todo", priority: "low" },
  { id: "4", title: "Analyser progression Emma", status: "done" },
];

async function readTasks() {
  try {
    const file = await fs.readFile(TASKS_FILE, "utf-8");
    return JSON.parse(file);
  } catch {
    return DEFAULT_TASKS;
  }
}

async function writeTasks(tasks: any[]) {
  await fs.mkdir(path.dirname(TASKS_FILE), { recursive: true });
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf-8");
}

export async function GET() {
  const tasks = await readTasks();
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const tasks = await readTasks();
  const newTask = { ...data, id: Date.now().toString() };
  const nextTasks = [...tasks, newTask];
  await writeTasks(nextTasks);
  return NextResponse.json(newTask, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  await writeTasks(data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const tasks = await readTasks();
  const nextTasks = tasks.filter((t) => t.id !== id);
  await writeTasks(nextTasks);
  return NextResponse.json({ ok: true });
}
