import type { Metadata } from 'next';
import { Urbanist } from 'next/font/google';
import { getBetaCount } from './actions';
import { BetaLandingClient } from './components/BetaLandingClient';

const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-urbanist',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'STRYVR — Bêta · Coaching ultra-personnalisé',
  description:
    'STRYVR adapte ton programme en temps réel. Rejoins la liste bêta pour le lancement en Belgique et France. Places limitées.',
  openGraph: {
    title: 'STRYVR — Bêta',
    description: '95% abandonnent. Pas toi. Rejoins la liste bêta STRYVR.',
    siteName: 'STRYVR',
  },
};

export default async function StryvrLandingPage() {
  const betaCount = await getBetaCount();

  return (
    <div className={urbanist.variable}>
      <BetaLandingClient betaCount={betaCount} />
    </div>
  );
}
