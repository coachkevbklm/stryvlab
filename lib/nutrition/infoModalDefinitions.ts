export interface InfoModalDef {
  title: string
  description: string
  example: string
  whenToUse: string
}

export const INJECTION_INFO_MODALS: Record<string, InfoModalDef> = {
  base: {
    title: 'Injecter les macros calculées',
    description:
      'Cette action va remplacer les calories, protéines, lipides et glucides du jour sélectionné avec les valeurs calculées ci-dessus.',
    example:
      'Si vous injectez dans "Jour entraînement", les macros deviendront : 2731 kcal, 122g protéines, 64g lipides, 417g glucides.',
    whenToUse:
      'Utilisez ce bouton après avoir ajusté votre objectif et vos paramètres pour populer le jour.',
  },
  carbCycleHigh: {
    title: 'Injecter un jour haut en glucides',
    description:
      'Cette action va injecter les macros optimisées pour un jour d\'entraînement avec un apport en glucides élevé.',
    example:
      'Un jour haut aura typiquement 350-400g de glucides pour supporter la performance, avec une quantité de lipides réduite.',
    whenToUse:
      'Utilisez ce bouton pour les jours d\'entraînement intensif afin de maximiser la performance et la récupération.',
  },
  carbCycleLow: {
    title: 'Injecter un jour bas en glucides',
    description:
      'Cette action va injecter les macros optimisées pour un jour de repos avec un apport en glucides réduit.',
    example:
      'Un jour bas aura typiquement 150-200g de glucides, compensé par un apport en lipides plus élevé pour atteindre les calories.',
    whenToUse:
      'Utilisez ce bouton pour les jours de repos ou de faible intensité pour optimiser l\'utilisation des graisses.',
  },
  hydration: {
    title: 'Injecter l\'hydratation recommandée',
    description:
      'Cette action va populer le champ hydratation avec le volume recommandé basé sur votre climat et votre activité.',
    example:
      'Pour un climat tempéré et un niveau d\'activité modéré, l\'hydratation recommandée est 3.8L (EFSA 2010).',
    whenToUse:
      'Utilisez ce bouton après avoir sélectionné votre climat pour obtenir une recommandation d\'hydratation personnalisée.',
  },
  allCalculations: {
    title: 'Injecter tous les calculs',
    description:
      'Cette action va remplacer toutes les données du jour sélectionné : macros (protéines, lipides, glucides) + hydratation.',
    example:
      'Injecter tous les calculs va remplir 2731 kcal, 122g protéines, 64g lipides, 417g glucides et 3.8L hydratation en une seule action.',
    whenToUse:
      'Utilisez ce bouton pour populer rapidement un jour complet avec tous les paramètres optimisés.',
  },
  carbCyclingToggle: {
    title: 'Carb Cycling — Alimentation cyclique en glucides',
    description:
      'Le Carb Cycling alterne automatiquement entre des jours hauts en glucides (entraînement) et des jours bas (repos) pour optimiser votre composition corporelle.',
    example:
      'En mode 2/1, vous aurez 2 jours hauts en glucides (>350g), puis 1 jour bas (<200g), puis le cycle recommence.',
    whenToUse:
      'Activez le Carb Cycling si vous cherchez une approche flexible pour adapter votre apport en glucides à votre programme d\'entraînement.',
  },
}
