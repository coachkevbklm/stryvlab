// lib/morpho/buildAnalysisPrompt.ts

export interface AnalysisContext {
  age?: number
  sex?: 'male' | 'female' | 'other'
  goal?: string
  weight_kg?: number
  height_cm?: number
  body_fat_pct?: number
  injuries?: string[]
  photo_positions: string[]
}

export function buildAnalysisPrompt(context: AnalysisContext): string {
  const {
    age, sex, goal, weight_kg, height_cm, body_fat_pct,
    injuries = [], photo_positions
  } = context

  const biometrics = [
    weight_kg ? `${weight_kg}kg` : null,
    height_cm ? `${height_cm}cm` : null,
    body_fat_pct != null ? `${body_fat_pct}% MG` : null,
  ].filter(Boolean).join(' | ') || 'non renseigné'

  return `Tu es un expert en biomécanique et analyse posturale. Tu analyses des photos morphologiques pour un coach sportif.

CONTEXTE CLIENT :
- Âge : ${age ?? 'non renseigné'}
- Sexe : ${sex ?? 'non renseigné'}
- Objectif : ${goal ?? 'non renseigné'}
- Biométrie : ${biometrics}
- Blessures connues : ${injuries.length > 0 ? injuries.join(', ') : 'aucune'}
- Photos fournies : ${photo_positions.join(', ')}

INSTRUCTIONS :
Analyse uniquement ce qui est visuellement observable. Ne tente PAS d'estimer le pourcentage de masse grasse ni les circumférences — ces données sont déjà renseignées ci-dessus si disponibles.

Concentre-toi sur :
1. Alignement postural global (tête, épaules, bassin, colonne)
2. Asymétries détectables (différences gauche/droite épaules, hanches, membres)
3. Drapeaux de sécurité (enroulement épaules, antéversion pelvienne, scoliose apparente, cyphose)
4. Recommandations d'exercices correctifs ou contre-indications si applicable

RÈGLES SAFETY GUARD (obligatoires) :
- Si enroulement d'épaules → type "contraindication" pour mouvement de poussée overhead
- Si asymétrie épaule visible → recommander exercices unilatéraux correctifs
- Si décalage de hanche > 3° estimé → insérer exercices correctifs unilatéraux

Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte (aucun texte avant ou après) :
{
  "score": <entier 0-100 représentant la qualité posturale globale>,
  "posture_summary": "<résumé 1-2 phrases de la posture générale>",
  "flags": [
    { "zone": "<shoulders|pelvis|spine|knees|ankles>", "severity": "<red|orange|green>", "label": "<description courte>" }
  ],
  "attention_points": [
    { "priority": <1-5 où 1=critique>, "description": "<description actionnable>", "zone": "<zone anatomique>" }
  ],
  "recommendations": [
    { "type": "<exercise|correction|contraindication>", "description": "<description>", "reference": "<référence ou chaîne vide>" }
  ],
  "asymmetries": {
    "shoulder_imbalance_cm": <nombre ou null>,
    "arm_diff_cm": <nombre ou null>,
    "hip_imbalance_cm": <nombre ou null>,
    "posture_notes": "<notes posturales texte>"
  },
  "stimulus_hints": {
    "dominant_pattern": "<pattern musculaire dominant visible ou null>",
    "weak_pattern": "<pattern musculaire faible visible ou null>",
    "notes": "<notes sur les adaptations programme>"
  }
}`
}
