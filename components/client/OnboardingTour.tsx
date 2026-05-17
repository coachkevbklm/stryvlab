'use client'

import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTour } from './TourContext'
import { useClientT } from './ClientI18nProvider'
import type { ClientDictKey } from '@/lib/i18n/clientTranslations'

type TourStep = {
  navIndex: number
  titleKey: ClientDictKey
  bodyKey: ClientDictKey
}

const TOUR_STEPS: TourStep[] = [
  {
    navIndex: 0,
    titleKey: 'tour.step0.title',
    bodyKey:  'tour.step0.body',
  },
  {
    navIndex: 1,
    titleKey: 'tour.step1.title',
    bodyKey:  'tour.step1.body',
  },
  {
    navIndex: 2,
    titleKey: 'tour.step2.title',
    bodyKey:  'tour.step2.body',
  },
  {
    navIndex: 0,
    titleKey: 'tour.step3.title',
    bodyKey:  'tour.step3.body',
  },
  {
    navIndex: 3,
    titleKey: 'tour.step4.title',
    bodyKey:  'tour.step4.body',
  },
]

export default function OnboardingTour() {
  const { t } = useClientT()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [navItemRects, setNavItemRects] = useState<DOMRect[]>([])
  const { setHighlightedNavIndex } = useTour()

  useEffect(() => {
    const done = localStorage.getItem('onboarding_tour_done')
    if (done === null || done === 'false') {
      const timer = setTimeout(() => {
        measureNavItems()
        setActive(true)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (active) {
      setHighlightedNavIndex(TOUR_STEPS[stepIndex].navIndex)
    } else {
      setHighlightedNavIndex(null)
    }
  }, [active, stepIndex, setHighlightedNavIndex])

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
      setHighlightedNavIndex(null)
      setActive(false)
    }
  }

  if (!active) return null

  const step = TOUR_STEPS[stepIndex]
  const targetNavIndex = step.navIndex
  const targetRect = navItemRects[targetNavIndex]
  const isLast = stepIndex === TOUR_STEPS.length - 1

  const tooltipLeft = targetRect
    ? Math.min(Math.max(targetRect.left + targetRect.width / 2, 160), window.innerWidth - 160)
    : window.innerWidth / 2

  return (
    <>
      <div className="fixed inset-0 z-[60] pointer-events-none">
        {targetRect && (
          <div
            className="absolute rounded-xl"
            style={{
              left: targetRect.left - 6,
              top: targetRect.top - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              background: 'transparent',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.75), 0 0 0 2px #ffe01e, 0 0 16px 3px rgba(255,224,30,0.5)',
            }}
          />
        )}
      </div>

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
        <div
          className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#161616] rotate-45 border-r border-b border-white/[0.06]"
          style={{
            left: targetRect
              ? `calc(50% + ${(targetRect.left + targetRect.width / 2) - tooltipLeft}px)`
              : '50%',
          }}
        />

        <div className="bg-[#161616] border-[0.3px] border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === stepIndex
                    ? 'w-4 h-1 bg-[#ffe01e]'
                    : i < stepIndex
                    ? 'w-1 h-1 bg-[#ffe01e]/40'
                    : 'w-1 h-1 bg-white/15'
                }`}
              />
            ))}
          </div>

          <p className="text-[13px] font-bold text-white mb-1">{t(step.titleKey)}</p>
          <p className="text-[12px] text-white/55 leading-relaxed mb-3">{t(step.bodyKey)}</p>

          <button
            onClick={advance}
            className="w-full h-9 flex items-center justify-between bg-[#ffe01e] hover:bg-[#ffd000] active:scale-[0.98] rounded-xl transition-all pl-4 pr-1.5"
          >
            <span className="text-[11px] font-barlow-condensed font-bold uppercase tracking-[0.10em] text-[#0d0d0d]">
              {isLast ? t('tour.cta.ready') : t('tour.cta.understood')}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-black/[0.12]">
              <ArrowRight size={13} className="text-[#0d0d0d]" />
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
