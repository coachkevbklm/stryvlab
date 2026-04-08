import React, { useState, useEffect } from "react";

export type AgendaEvent = {
  id: string;
  title: string;
  date: string; // format YYYY-MM-DD
  time?: string; // format HH:mm
  description?: string;
  priority?: "high" | "medium" | "low";
};

interface AgendaCalendarProps {
  initialEvents?: AgendaEvent[];
  events?: AgendaEvent[];
}

const AgendaCalendar: React.FC<AgendaCalendarProps> = ({
  initialEvents = [],
  events: eventsProp = [],
}) => {
  const [events, setEvents] = useState<AgendaEvent[]>(
    eventsProp.length > 0 ? eventsProp : initialEvents,
  );
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<AgendaEvent>>({
    priority: "medium",
  });
  const [loading, setLoading] = useState(false);

  // Chargement initial depuis l'API si aucun événement passé en props
  useEffect(() => {
    if (eventsProp.length > 0) return;

    fetch("/api/agenda")
      .then((res) => res.json())
      .then((data) => setEvents(data));
  }, [eventsProp.length]);

  // Ajout d'un événement (POST)
  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) return;
    setLoading(true);
    const res = await fetch("/api/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time,
        description: newEvent.description,
        priority: newEvent.priority || "medium",
      }),
    });
    const created = await res.json();
    setEvents((prev) => [...prev, created]);
    setShowModal(false);
    setNewEvent({ priority: "medium" });
    setLoading(false);
  };

  // Suppression d'un événement (DELETE)
  const handleDeleteEvent = async (id: string) => {
    await fetch("/api/agenda", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Mise à jour de tous les événements (PUT, pour bulk update)
  const handleUpdateEvents = async (newEvents: AgendaEvent[]) => {
    setEvents(newEvents);
    await fetch("/api/agenda", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvents),
    });
  };

  // Regroupe les événements par date
  const grouped = events.reduce<Record<string, AgendaEvent[]>>((acc, ev) => {
    acc[ev.date] = acc[ev.date] || [];
    acc[ev.date].push(ev);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="relative w-full bg-[#181818] rounded-xl p-4">
      <button
        className="absolute -top-2 right-0 z-10 flex items-center gap-1 px-3 py-1.5 bg-[#1f8a65] text-white rounded-lg text-xs font-bold hover:bg-[#217356] transition-colors"
        onClick={() => setShowModal(true)}
      >
        + Nouvel événement
      </button>
      <h4 className="text-white/70 text-xs font-bold mb-3 uppercase tracking-wider">
        Agenda
      </h4>
      <div className="space-y-4">
        {sortedDates.length === 0 && (
          <div className="text-white/30 text-xs italic">
            Aucun événement à venir
          </div>
        )}
        {sortedDates.map((date) => (
          <div key={date}>
            <div className="text-white/50 text-xs font-bold mb-1">{date}</div>
            <div className="space-y-2">
              {grouped[date].map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white/[0.03] rounded-lg p-3 flex items-center justify-between group relative"
                >
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {ev.title}
                    </div>
                    {ev.description && (
                      <div className="text-white/50 text-xs">
                        {ev.description}
                      </div>
                    )}
                    {ev.time && (
                      <div className="text-white/30 text-[11px]">{ev.time}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {ev.priority && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 ${
                          ev.priority === "high"
                            ? "bg-red-500/30 text-red-400"
                            : ev.priority === "medium"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {ev.priority === "high"
                          ? "Priorité haute"
                          : ev.priority === "medium"
                            ? "Moyenne"
                            : "Basse"}
                      </span>
                    )}
                    <button
                      className="ml-2 text-white/30 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition"
                      title="Supprimer"
                      onClick={() => handleDeleteEvent(ev.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal ajout événement */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#181818] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white mb-2">Nouvel événement</h3>
            <div className="space-y-3">
              <input
                className="w-full rounded-xl bg-[#0a0a0a] px-4 py-2 text-[14px] font-medium text-white placeholder:text-white/20 outline-none h-[44px]"
                placeholder="Titre de l'événement"
                value={newEvent.title || ""}
                onChange={(e) =>
                  setNewEvent((ev) => ({ ...ev, title: e.target.value }))
                }
              />
              <textarea
                className="w-full rounded-xl bg-[#0a0a0a] px-4 py-2 text-[14px] font-medium text-white placeholder:text-white/20 outline-none h-[70px]"
                placeholder="Description (optionnel)"
                value={newEvent.description || ""}
                onChange={(e) =>
                  setNewEvent((ev) => ({ ...ev, description: e.target.value }))
                }
              />
              <input
                type="date"
                className="w-full rounded-xl bg-[#0a0a0a] px-4 py-2 text-[14px] font-medium text-white placeholder:text-white/20 outline-none h-[44px]"
                value={newEvent.date || ""}
                onChange={(e) =>
                  setNewEvent((ev) => ({ ...ev, date: e.target.value }))
                }
              />
              <input
                type="time"
                className="w-full rounded-xl bg-[#0a0a0a] px-4 py-2 text-[14px] font-medium text-white placeholder:text-white/20 outline-none h-[44px]"
                value={newEvent.time || ""}
                onChange={(e) =>
                  setNewEvent((ev) => ({ ...ev, time: e.target.value }))
                }
              />
              <select
                className="rounded-xl bg-[#0a0a0a] px-3 py-2 text-white text-sm"
                value={newEvent.priority}
                onChange={(e) =>
                  setNewEvent((ev) => ({
                    ...ev,
                    priority: e.target.value as AgendaEvent["priority"],
                  }))
                }
              >
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-[13px] text-white/55 hover:text-white/80 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleAddEvent}
                className="flex-1 py-2.5 rounded-xl bg-[#1f8a65] text-white text-[13px] font-bold hover:bg-[#217356] transition-colors"
                disabled={!newEvent.title || !newEvent.date || loading}
              >
                {loading ? "..." : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaCalendar;
