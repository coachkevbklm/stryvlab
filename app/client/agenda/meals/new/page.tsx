'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import ClientTopBar from '@/components/client/ClientTopBar'
import { Mic, MicOff, Camera, X, ArrowRight } from 'lucide-react'

function timeNow() {
  return new Date().toTimeString().slice(0, 5)
}

function dateIso(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function AddMealPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('Repas')
  const [transcript, setTranscript] = useState('')
  const [time, setTime] = useState(timeNow)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [recording, setRecording] = useState(false)
  const recognitionRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleVoice = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) return

    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }

    const rec = new SpeechRecognition()
    rec.lang = 'fr-FR'
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e: any) => {
      const result = Array.from(e.results as SpeechRecognitionResultList)
        .map((r: any) => r[0].transcript)
        .join(' ')
      setTranscript(prev => (prev ? `${prev} ${result}` : result))
    }
    rec.onend = () => setRecording(false)
    rec.start()
    recognitionRef.current = rec
    setRecording(true)
  }, [recording])

  async function uploadPhotos(files: File[]): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const urls: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('meal-photos')
        .upload(path, file, { upsert: false })
      if (error) continue
      const { data } = supabase.storage.from('meal-photos').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - photoFiles.length)
    setPhotoFiles(prev => [...prev, ...files].slice(0, 3))
    const previews = files.map(f => URL.createObjectURL(f))
    setPhotoPreviewUrls(prev => [...prev, ...previews].slice(0, 3))
  }

  function removePhoto(idx: number) {
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx))
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    try {
      const uploadedUrls = await uploadPhotos(photoFiles)
      const today = dateIso(new Date())
      const loggedAt = new Date(`${today}T${time}:00`).toISOString()

      const res = await fetch('/api/client/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          logged_at: loggedAt,
          transcript: transcript || null,
          photo_urls: uploadedUrls,
        }),
      })

      if (!res.ok) throw new Error('Failed to save meal')

      router.push('/client/agenda')
    } catch {
      setSubmitting(false)
    }
  }

  const hasSpeechAPI = typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

  return (
    <div className="min-h-screen bg-[#121212]">
      <ClientTopBar section="Nutrition" title="Nouveau repas" />

      <main className="max-w-lg mx-auto px-4 pt-[88px] pb-28 space-y-4">
        {/* Meal name */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
            Nom du repas
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl bg-[#0a0a0a] px-4 h-[52px] text-[14px] font-medium text-white placeholder:text-white/20 outline-none"
            placeholder="Petit-déjeuner, Collation pré-entraînement..."
          />
        </div>

        {/* Time */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
            Heure
          </label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full rounded-xl bg-[#0a0a0a] px-4 h-[52px] text-[14px] font-medium text-white outline-none"
          />
        </div>

        {/* Transcript */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
              Description
            </label>
            {hasSpeechAPI && (
              <button
                onClick={toggleVoice}
                className={`flex items-center gap-1.5 px-3 h-7 rounded-lg text-[11px] font-semibold transition-colors ${
                  recording
                    ? 'bg-red-500/20 text-red-400 animate-pulse'
                    : 'bg-white/[0.04] text-white/45 hover:bg-white/[0.08]'
                }`}
              >
                {recording ? <MicOff size={12} /> : <Mic size={12} />}
                {recording ? 'Stop' : 'Vocal'}
              </button>
            )}
          </div>
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-[#0a0a0a] px-4 py-3.5 text-[14px] font-medium text-white placeholder:text-white/20 outline-none resize-none leading-relaxed"
            placeholder="Ex: 250ml lait écrémé, 40g flocons d'avoine, 1 banane..."
          />
        </div>

        {/* Photos */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
            Photos (optionnel, max 3)
          </label>
          <div className="flex gap-2 flex-wrap">
            {photoPreviewUrls.map((url, i) => (
              <div key={i} className="relative w-20 h-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
            {photoFiles.length < 3 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl border-[0.3px] border-dashed border-white/20 flex flex-col items-center justify-center gap-1 text-white/30 hover:text-white/50 hover:border-white/30 transition-colors"
              >
                <Camera size={18} />
                <span className="text-[9px]">Ajouter</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !name.trim()}
          className="group/btn flex h-[52px] w-full items-center justify-between rounded-xl bg-[#1f8a65] pl-5 pr-1.5 transition-all hover:bg-[#217356] active:scale-[0.99] disabled:opacity-50"
        >
          <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white">
            {submitting ? 'Enregistrement...' : 'Enregistrer'}
          </span>
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-black/[0.12]">
            <ArrowRight size={16} className="text-white" />
          </div>
        </button>
      </main>
    </div>
  )
}
