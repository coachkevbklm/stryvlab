// jobs/morpho/analyzeMorphoJob.ts
// Async orchestrator: fetch photos → OpenAI Vision → parse → calculate adjustments → save

import { createClient } from '@supabase/supabase-js'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = any
import { analyzePhotoWithOpenAI, getPhotoUrlsFromSubmission, getLatestClientBiometrics } from '@/lib/morpho/analyze'
import { parseMorphoResponses, estimateMuscleFromBiometrics } from '@/lib/morpho/parse'
import { calculateStimulusAdjustments } from '@/lib/morpho/adjustments'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function analyzeMorphoJob(morphoAnalysisId: string): Promise<void> {
  const supabase = getServiceClient()

  console.log(`[MorphoJob] Démarrage analyse: ${morphoAnalysisId}`)

  try {
    // 1. Récupérer l'enregistrement morpho
    const { data: analysis, error: fetchError } = await supabase
      .from('morpho_analyses')
      .select('id, client_id, assessment_submission_id')
      .eq('id', morphoAnalysisId)
      .single()

    if (fetchError || !analysis) {
      throw new Error(`MorphoAnalysis introuvable: ${morphoAnalysisId}`)
    }

    if (!analysis.assessment_submission_id) {
      throw new Error(`Aucune soumission liée à l'analyse ${morphoAnalysisId}`)
    }

    // 2. Récupérer les URLs des photos
    const photoUrls = await getPhotoUrlsFromSubmission(analysis.assessment_submission_id, supabase as Sb)

    if (photoUrls.length === 0) {
      throw new Error(`Aucune photo dans la soumission ${analysis.assessment_submission_id}`)
    }

    console.log(`[MorphoJob] ${photoUrls.length} photo(s) trouvée(s), appel OpenAI Vision...`)

    // 3. Analyser chaque photo en parallèle via OpenAI Vision
    const visionResults = await Promise.all(
      photoUrls.map((url) => analyzePhotoWithOpenAI(url))
    )

    console.log(`[MorphoJob] Vision terminée, parsing des réponses...`)

    // 4. Parser les réponses OpenAI Vision
    const extracted = parseMorphoResponses(visionResults)

    // 5. Récupérer les biométriques client (poids, taille)
    const biometrics = await getLatestClientBiometrics(analysis.client_id, supabase as Sb)

    // 6. Estimer la masse musculaire si non fournie par Vision
    if (
      extracted.body_fat_pct !== undefined &&
      biometrics.weight_kg !== undefined &&
      extracted.estimated_muscle_mass_kg === undefined
    ) {
      extracted.estimated_muscle_mass_kg = estimateMuscleFromBiometrics(
        biometrics.weight_kg,
        extracted.body_fat_pct
      )
    }

    // 7. Calculer les ajustements de stimulus par pattern
    const stimulusAdjustments = calculateStimulusAdjustments(extracted, {
      height_cm: biometrics.height_cm,
    })

    console.log(`[MorphoJob] Ajustements calculés, sauvegarde...`)

    // 8. Construire les objets JSONB
    const bodyComposition =
      extracted.body_fat_pct !== undefined || extracted.estimated_muscle_mass_kg !== undefined
        ? {
            body_fat_pct: extracted.body_fat_pct,
            estimated_muscle_mass_kg: extracted.estimated_muscle_mass_kg,
            visceral_fat_level: extracted.visceral_fat_level,
          }
        : null

    const dimensions =
      extracted.dimensions && Object.keys(extracted.dimensions).length > 0
        ? extracted.dimensions
        : null

    const asymmetries =
      extracted.asymmetries && Object.keys(extracted.asymmetries).length > 0
        ? extracted.asymmetries
        : null

    // 9. Mettre à jour l'enregistrement morpho_analyses
    const { error: updateError } = await supabase
      .from('morpho_analyses')
      .update({
        status: 'completed',
        body_composition: bodyComposition,
        dimensions,
        asymmetries,
        stimulus_adjustments: stimulusAdjustments,
        raw_payload: visionResults,
        updated_at: new Date().toISOString(),
      })
      .eq('id', morphoAnalysisId)

    if (updateError) {
      throw new Error(`Erreur sauvegarde: ${updateError.message}`)
    }

    console.log(`[MorphoJob] Analyse terminée avec succès: ${morphoAnalysisId}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error(`[MorphoJob] Erreur pour ${morphoAnalysisId}:`, message)

    // Enregistrer l'erreur dans la DB
    await supabase
      .from('morpho_analyses')
      .update({
        status: 'failed',
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', morphoAnalysisId)
  }
}
