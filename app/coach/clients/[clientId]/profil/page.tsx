// app/coach/clients/[clientId]/profil/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useSetTopBar } from "@/components/layout/useSetTopBar";
import { useClient } from "@/lib/client-context";
import ClientHeader from "@/components/clients/ClientHeader";
import ClientAccessToken from "@/components/clients/ClientAccessToken";
import RestrictionsWidget from "@/components/clients/RestrictionsWidget";
import ClientFormulasTab from "@/components/crm/ClientFormulasTab";
import ClientCrmTab from "@/components/crm/ClientCrmTab";
import DeleteClientModal from "@/components/clients/DeleteClientModal";
import {
  Mail, Phone, Calendar, Edit2, Save, Loader2,
} from "lucide-react";

const TRAINING_GOALS = [
  { value: "hypertrophy", label: "Hypertrophie" },
  { value: "strength", label: "Force" },
  { value: "fat_loss", label: "Perte de gras" },
  { value: "endurance", label: "Endurance" },
  { value: "recomp", label: "Recomposition" },
  { value: "maintenance", label: "Maintenance" },
  { value: "athletic", label: "Athlétique" },
];
const FITNESS_LEVELS = [
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
  { value: "elite", label: "Élite" },
];
const SPORT_PRACTICES = [
  { value: "sedentary", label: "Sédentaire" },
  { value: "light", label: "Légèrement actif" },
  { value: "moderate", label: "Modérément actif" },
  { value: "active", label: "Actif" },
  { value: "athlete", label: "Athlète" },
];
const EQUIPMENT_CATEGORIES = [
  { value: "bodyweight", label: "Poids du corps" },
  { value: "home_dumbbells", label: "Domicile — Haltères" },
  { value: "home_full", label: "Domicile — Complet" },
  { value: "home_rack", label: "Rack à domicile" },
  { value: "functional_box", label: "Box / Fonctionnel" },
  { value: "commercial_gym", label: "Salle de sport" },
];

export default function ProfilPage() {
  const { client, clientId, refetch } = useClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [draft, setDraft] = useState({
    training_goal: client.training_goal ?? "",
    fitness_level: client.fitness_level ?? "",
    sport_practice: client.sport_practice ?? "",
    weekly_frequency: client.weekly_frequency?.toString() ?? "",
    equipment_category: client.equipment_category ?? "",
    notes: client.notes ?? "",
  });

  const topBarLeft = useMemo(
    () => (
      <div>
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.18em]">Lab</p>
        <p className="text-[13px] font-semibold text-white leading-none">
          {client.first_name} {client.last_name} — Profil
        </p>
      </div>
    ),
    [client.first_name, client.last_name],
  );
  useSetTopBar(topBarLeft);

  async function save() {
    setSaving(true);
    await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        training_goal: draft.training_goal || null,
        fitness_level: draft.fitness_level || null,
        sport_practice: draft.sport_practice || null,
        weekly_frequency: draft.weekly_frequency ? Number(draft.weekly_frequency) : null,
        equipment_category: draft.equipment_category || null,
        notes: draft.notes || null,
      }),
    });
    await refetch();
    setSaving(false);
    setEditing(false);
  }

  return (
    <main className="min-h-screen bg-[#121212]">
      <ClientHeader />

      <div className="px-6 pb-24 space-y-4">
        {/* Infos contact */}
        <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40 mb-4">
            Informations
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {client.email && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Mail size={13} className="text-white/40" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Email</p>
                  <p className="text-[13px] text-white font-medium">{client.email}</p>
                </div>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Phone size={13} className="text-white/40" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Téléphone</p>
                  <p className="text-[13px] text-white font-medium">{client.phone}</p>
                </div>
              </div>
            )}
            {client.date_of_birth && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Calendar size={13} className="text-white/40" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Date de naissance</p>
                  <p className="text-[13px] text-white font-medium">
                    {new Date(client.date_of_birth).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                <Calendar size={13} className="text-white/40" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Client depuis</p>
                <p className="text-[13px] text-white font-medium">
                  {new Date(client.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profil sportif */}
        <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
              Profil sportif
            </p>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors"
              >
                <Edit2 size={12} /> Modifier
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="text-[11px] text-white/40 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-[#1f8a65] hover:bg-[#217356] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                  Enregistrer
                </button>
              </div>
            )}
          </div>
          {!editing ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Objectif", value: TRAINING_GOALS.find(g => g.value === client.training_goal)?.label },
                { label: "Niveau", value: FITNESS_LEVELS.find(l => l.value === client.fitness_level)?.label },
                { label: "Activité", value: SPORT_PRACTICES.find(s => s.value === client.sport_practice)?.label },
                { label: "Fréquence", value: client.weekly_frequency ? `${client.weekly_frequency}j/sem.` : null },
                { label: "Équipement", value: EQUIPMENT_CATEGORIES.find(e => e.value === client.equipment_category)?.label },
              ].filter(f => f.value).map(field => (
                <div key={field.label}>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium mb-1">{field.label}</p>
                  <p className="text-[13px] text-white font-semibold">{field.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1.5">Objectif</label>
                <select
                  value={draft.training_goal}
                  onChange={e => setDraft(d => ({ ...d, training_goal: e.target.value }))}
                  className="w-full rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.06] px-3 h-10 text-[13px] text-white outline-none"
                >
                  <option value="">—</option>
                  {TRAINING_GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1.5">Niveau</label>
                <select
                  value={draft.fitness_level}
                  onChange={e => setDraft(d => ({ ...d, fitness_level: e.target.value }))}
                  className="w-full rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.06] px-3 h-10 text-[13px] text-white outline-none"
                >
                  <option value="">—</option>
                  {FITNESS_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1.5">Activité</label>
                <select
                  value={draft.sport_practice}
                  onChange={e => setDraft(d => ({ ...d, sport_practice: e.target.value }))}
                  className="w-full rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.06] px-3 h-10 text-[13px] text-white outline-none"
                >
                  <option value="">—</option>
                  {SPORT_PRACTICES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1.5">Fréquence (j/sem)</label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={draft.weekly_frequency}
                  onChange={e => setDraft(d => ({ ...d, weekly_frequency: e.target.value }))}
                  className="w-full rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.06] px-3 h-10 text-[13px] text-white outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1.5">Équipement</label>
                <select
                  value={draft.equipment_category}
                  onChange={e => setDraft(d => ({ ...d, equipment_category: e.target.value }))}
                  className="w-full rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.06] px-3 h-10 text-[13px] text-white outline-none"
                >
                  <option value="">—</option>
                  {EQUIPMENT_CATEGORIES.map(eq => <option key={eq.value} value={eq.value}>{eq.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1.5">Notes</label>
                <textarea
                  value={draft.notes}
                  onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.06] px-3 py-2.5 text-[13px] text-white outline-none resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Restrictions physiques */}
        <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40 mb-4">
            Restrictions physiques
          </p>
          <RestrictionsWidget clientId={clientId} />
        </div>

        {/* Accès client */}
        <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40 mb-4">
            Accès client
          </p>
          <ClientAccessToken
            clientId={clientId}
            clientStatus={client.status ?? "inactive"}
            clientEmail={client.email ?? null}
          />
        </div>

        {/* Formules */}
        <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40 mb-4">
            Formules & abonnement
          </p>
          <ClientFormulasTab clientId={clientId} />
        </div>

        {/* CRM */}
        <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40 mb-4">
            Notes CRM
          </p>
          <ClientCrmTab clientId={clientId} />
        </div>

        {/* Zone dangereuse */}
        <div className="bg-red-950/20 border-[0.3px] border-red-500/20 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-400/60 mb-3">
            Zone dangereuse
          </p>
          <button
            onClick={() => setShowDelete(true)}
            className="text-[12px] text-red-400/70 hover:text-red-400 transition-colors font-medium"
          >
            Supprimer ou archiver ce client
          </button>
        </div>
      </div>

      {showDelete && (
        <DeleteClientModal
          clientId={clientId}
          clientName={`${client.first_name} ${client.last_name}`}
          onClose={() => setShowDelete(false)}
          onSuccess={() => setShowDelete(false)}
        />
      )}
    </main>
  );
}
