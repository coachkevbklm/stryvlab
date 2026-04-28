// lib/morpho/types.ts

export type MorphoPhotoPosition =
  | 'front' | 'back' | 'left' | 'right'
  | 'three_quarter_front_left' | 'three_quarter_front_right'

export type MorphoPhotoSource = 'assessment' | 'coach_upload'

export interface MorphoPhoto {
  id: string
  client_id: string
  coach_id: string
  storage_path: string
  position: MorphoPhotoPosition
  taken_at: string
  source: MorphoPhotoSource
  assessment_response_id?: string | null
  notes?: string | null
  created_at: string
  // enrichis par l'API
  signed_url?: string
  has_annotation?: boolean
  thumbnail_url?: string | null
}

export interface MorphoAnnotation {
  id: string
  photo_id: string
  coach_id: string
  canvas_data: Record<string, unknown>
  thumbnail_path?: string | null
  analysis_snapshot?: MorphoAnalysisResult | null
  created_at: string
  updated_at: string
}

export interface MorphoFlag {
  zone: 'shoulders' | 'pelvis' | 'spine' | 'knees' | 'ankles'
  severity: 'red' | 'orange' | 'green'
  label: string
}

export interface MorphoAttentionPoint {
  priority: number
  description: string
  zone: string
}

export interface MorphoRecommendation {
  type: 'exercise' | 'correction' | 'contraindication'
  description: string
  reference: string
}

export interface MorphoAsymmetries {
  shoulder_imbalance_cm: number | null
  arm_diff_cm: number | null
  hip_imbalance_cm: number | null
  posture_notes: string
}

export interface MorphoStimulusHints {
  dominant_pattern: string | null
  weak_pattern: string | null
  notes: string
}

export interface MorphoAnalysisResult {
  score: number
  posture_summary: string
  flags: MorphoFlag[]
  attention_points: MorphoAttentionPoint[]
  recommendations: MorphoRecommendation[]
  asymmetries: MorphoAsymmetries
  stimulus_hints: MorphoStimulusHints
}

export interface MorphoAnalysis {
  id: string
  client_id: string
  analysis_date: string
  status: 'pending' | 'completed' | 'failed'
  photo_ids: string[]
  analysis_result?: MorphoAnalysisResult | null
  body_composition?: {
    body_fat_pct?: number
    estimated_muscle_mass_kg?: number
  } | null
  asymmetries?: {
    arm_diff_cm?: number
    shoulder_imbalance_cm?: number
    hip_imbalance_cm?: number
    posture_notes?: string
  } | null
  stimulus_adjustments?: Record<string, number> | null
  error_message?: string | null
}

export const POSITION_LABELS: Record<MorphoPhotoPosition, string> = {
  front: 'Face',
  back: 'Dos',
  left: 'Profil G',
  right: 'Profil D',
  three_quarter_front_left: '¾ Avant G',
  three_quarter_front_right: '¾ Avant D',
}
