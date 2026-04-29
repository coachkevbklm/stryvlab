'use client'

import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'

type TourStep = {
  navIndex: number // index in BottomNav (0=Home, 1=Programme, 2=Nutrition, 3=Profil)
  title: string
  body: string
}

const TOUR_STEPS: TourStep[] = [
  {
    navIndex: 0,
    title: 'Ton dashboard',
    body: 'C\'est ton point de départ. Tes actions du jour et les messages de ton coach sont ici.',
  },
  {
    navIndex: 1,
    title: 'Ton programme',
    body: 'Retrouve tes séances de la semaine et ta progression dans le temps.',
  },
  {
    navIndex: 2,
    title: 'Ta nutrition',
    body: 'Ton protocole nutritionnel préparé par ton coach. Macros, hydratation, jours hauts et bas.',
  },
  {
    navIndex: 3,
    title: 'Ton profil',
    body: 'Complète ton profil — tes restrictions physiques, tes préférences. Important pour que ton coach puisse t\'accompagner au mieux.',
  },
]

export default function OnboardingTour() {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [navItemRects, setNavItemRects] = useState<DOMRect[]>([])

  useEffect(() => {
    const done = localStorage.getItem('onboarding_tour_done')
    if (done === 'false') {
      // Small delay so nav renders fully before we measure
      const timer = setTimeout(() => {
        measureNavItems()
        setActive(true)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [])

  function measureNavItems() {
    const nav = document.querySelector('nav')
    if (!nav) return
    const links = nav.querySelectorAll('a')
    const rects: DOMRect[] = []
    links.forEach((link) => rects.push(link.getBoundingClientRect()))
    setNavItemRects(rects)
  }

  function advance() {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((i) => i + 1)
    } else {
      localStorage.setItem('onboarding_tour_done', 'true')
      setActive(false)
    }
  }

  if (!active) return null

  const step = TOUR_STEPS[stepIndex]
  const targetNavIndex = step.navIndex
  const targetRect = navItemRects[targetNavIndex]
  const isLast = stepIndex === TOUR_STEPS.length - 1

  // Tooltip positioning: above the highlighted nav item
  const tooltipLeft = targetRect
    ? Math.min(Math.max(targetRect.left + targetRect.width / 2, 160), window.innerWidth - 160)
    : window.innerWidth / 2

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[60] pointer-events-none">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70" />

        {/* Highlight cutout around nav item */}
        {targetRect && (
          <div
            className="absolute rounded-xl ring-2 ring-[#1f8a65] ring-offset-2 ring-offset-transparent bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.70)]"
            style={{
              left: targetRect.left - 4,
              top: targetRect.top - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-[70] pointer-events-auto"
        style={{
          bottom: targetRect
            ? window.innerHeight - targetRect.top + 16
            : 120,
          left: tooltipLeft,
          transform: 'translateX(-50%)',
          width: 'min(280px, calc(100vw - 32px)',
        }}
      >
        {/* Arrow pointing down */}
        <div
          className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#181818] rotate-45 border-r border-b border-white/[0.06]"
          style={{
            left: targetRect
              ? `calc(50% + ${(targetRect.left + targetRect.width / 2) - tooltipLeft}px)`
              : '50%',
          }}
        />

        <div className="bg-[#181818] border-[0.3px] border-white/[0.06] rounded-xl p-4">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-2">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === stepIndex
                    ? 'w-4 h-1 bg-[#1f8a65]'
                    : i < stepIndex
                    ? 'w-1 h-1 bg-[#1f8a65]/40'
                    : 'w-1 h-1 bg-white/15'
                }`}
              />
            ))}
          </div>

          <p className="text-[13px] font-bold text-white mb-1">{step.title}</p>
          <p className="text-[12px] text-white/55 leading-relaxed mb-3">{step.body}</p>

          <button
            onClick={advance}
            className="w-full h-9 flex items-center justify-between bg-[#1f8a65] hover:bg-[#217356] active:scale-[0.98] rounded-lg transition-all pl-4 pr-1.5"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.10em] text-white">
              {isLast ? 'C\'est parti' : 'Compris'}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black/[0.12]">
              <ArrowRight size={13} className="text-white" />
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
