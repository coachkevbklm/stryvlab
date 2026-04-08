import { NextRequest, NextResponse } from "next/server";

// Pour démo : stockage en mémoire (remplacer par DB plus tard)
let events: any[] = [
  {
    id: "e1",
    title: "Séance Paul",
    date: "2026-04-08",
    time: "10:00",
    priority: "high",
  },
  {
    id: "e2",
    title: "Bilan Julie",
    date: "2026-04-09",
    time: "14:00",
    priority: "medium",
  },
  {
    id: "e3",
    title: "Appel découverte",
    date: "2026-04-10",
    time: "09:00",
    priority: "low",
  },
];

export async function GET() {
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const newEvent = { ...data, id: Date.now().toString() };
  events.push(newEvent);
  return NextResponse.json(newEvent, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  events = data;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  events = events.filter((e) => e.id !== id);
  return NextResponse.json({ ok: true });
}
