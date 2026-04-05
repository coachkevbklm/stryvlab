import type { Metadata } from 'next';
import OneRMCalculator from './OneRMCalculator';

export const metadata: Metadata = {
  title: 'Calculateur 1RM & Charges | STRYV lab',
  description: 'Estimez votre One Rep Max (1RM) et générez vos charges d\'entraînement (Force, Hypertrophie) via les algorithmes Brzycki, Epley et Lombardi.',
  openGraph: {
    title: 'Calculateur 1RM Pro | STRYV lab',
    description: 'Calculez votre force maximale et vos % de charge instantanément.',
    url: 'https://www.stryvlab.com/outils/1rm',
    siteName: 'STRYV lab',
    images: [
      {
        url: '/og-toolshub.jpg', 
        width: 1200,
        height: 630,
        alt: 'Calculateur 1RM STRYV lab',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function Page() {
  return <OneRMCalculator />;
}