import type { Metadata } from 'next';
import MacroCalculator from './MacroCalculator';

export const metadata: Metadata = {
  title: 'Macro Calculator - Calories & Macronutriments | STRYV lab',
  description: 'Calculateur nutritionnel scientifique. BMR Mifflin-St Jeor, TDEE précis et répartition macronutriments optimisée pour la performance (Helms 2014, Morton 2018).',
  
  openGraph: {
    title: 'Macro Calculator Pro | STRYV lab',
    description: 'Calculez vos calories et macros avec précision scientifique.',
    url: 'https://www.stryvlab.com/outils/macros',
    siteName: 'STRYV lab',
    images: [
      {
        url: '/og-macros.png',
        width: 1200,
        height: 630,
        alt: 'Macro Calculator STRYV lab',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Macro Calculator Pro | STRYV lab',
    description: 'Nutrition de précision pour athlètes.',
    images: ['/og-macros.png'],
  },
};

export default function MacrosPage() {
  return <MacroCalculator />;
}