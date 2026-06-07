'use client'

import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTour } from './TourContext'
import { useClientT } from './ClientI18nProvider'
import type { ClientDictKey } from '@/lib/i18n/clientTranslations'

type TourStep = {
  navIndex?: number  // highlight a bottom-nav tab (0=Chat, 1=Programme, 2=Nutrition, 3=Metrics)
  isFAB?: boolean    // highlight the central + FAB
  isFemaleOnly?: boolean  // only show for female clients
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
    isFAB: true,
    titleKey: 'tour.step3.title',
    bodyKey:  'tour.step3.body',
  },
  {
    navIndex: 3,
    titleKey: 'tour.step4.title',
    bodyKey:  'tour.step4.body',
  },
  {
    titleKey: 'tour.topbar.title',
    bodyKey:  'tour.topbar.checkin',  // will show first topbar indicator
  },
  {
    isFemaleOnly: true,
    titleKey: 'tour.female.title',
    bodyKey:  'tour.female.body',
  },
]

export default function OnboardingTour() {
  const { t } = useClientT()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [navItemRects, setNavItemRects] = useState<DOMRect[]>([])
  const [fabRect, setFabRect] = useState<DOMRect | null>(null)
  const [isFemale, setIsFemale] = useState(false)
  const { setHighlightedNavIndex, setHighlightFAB } = useTour()

  useEffect(() => {
    const done = localStorage.getItem('onboarding_tour_done')
    if (done === null || done === 'false') {
      const timer = setTimeout(() => {
        measureElements()
        setActive(true)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    // Fetch client gender for female-only tour steps
    fetch('/api/client/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.gender === 'female') setIsFemale(true)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!active) {
      setHighlightedNavIndex(null)
      setHighlightFAB(false)
      return
    }
    const step = TOUR_STEPS[stepIndex]
    if (step.isFAB) {
      setHighlightedNavIndex(null)
      setHighlightFAB(true)
    } else {
      setHighlightFAB(false)
      setHighlightedNavIndex(step.navIndex ?? null)
    }
  }, [active, stepIndex, setHighlightedNavIndex, setHighlightFAB])

  function measureElements() {
    const nav = document.querySelector('nav')
    if (!nav) return

    // Measure <a> links for tab items
    const links = nav.querySelectorAll('a')
    const rects: DOMRect[] = []
    links.forEach((link) => rects.push(link.getBoundingClientRect()))
    setNavItemRects(rects)

    // Measure central FAB button
    const fab = nav.querySelector('[data-tour-fab]')
    if (fab) setFabRect(fab.getBoundingClientRect())
  }

  // Filter steps based on isFemale
  const visibleSteps = TOUR_STEPS.filter((step) => !step.isFemaleOnly || isFemale)

  function advance() {
    if (stepIndex < visibleSteps.length - 1) {
      setStepIndex((i) => i + 1)
    } else {
      localStorage.setItem('onboarding_tour_done', 'true')
      setHighlightedNavIndex(null)
      setHighlightFAB(false)
      setActive(false)
    }
  }

  if (!active) return null

  const step = visibleSteps[stepIndex]
  const isLast = stepIndex === visibleSteps.length - 1

  // Resolve the target rect (FAB or nav tab)
  const targetRect: DOMRect | undefined = step.isFAB
    ? (fabRect ?? undefined)
    : step.navIndex !== undefined
      ? navItemRects[step.navIndex]
      : undefined

  const isFABStep = !!step.isFAB

  const tooltipLeft = targetRect
    ? Math.min(Math.max(targetRect.left + targetRect.width / 2, 160), window.innerWidth - 160)
    : window.innerWidth / 2

  return (
    <>
      {/* Spotlight overlay — for nav tabs only (FAB handles its own highlight via boxShadow) */}
      {!isFABStep && (
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
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.80), 0 0 0 2px #f2f2f2',
              }}
            />
          )}
        </div>
      )}

      {/* Dimmer for FAB step (FAB itself is elevated via z-index + boxShadow) */}
      {isFABStep && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 60, background: 'rgba(0,0,0,0.80)' }}
        />
      )}

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
        {/* Arrow pointing down toward target */}
        <div
          className="absolute bottom-[-6px] w-3 h-3 bg-[#111111] rotate-45 border-r"
          style={{
            left: targetRect
              ? `calc(50% + ${(targetRect.left + targetRect.width / 2) - tooltipLeft}px)`
              : '50%',
            transform: 'translateX(-50%) rotate(45deg)',
          }}
        />

        <div className="bg-[#111111] rounded-xl p-4">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-2">
            {visibleSteps.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === stepIndex
                    ? 'w-4 h-1 bg-[#f2f2f2]'
                    : i < stepIndex
                    ? 'w-1 h-1 bg-[#f2f2f2]/40'
                    : 'w-1 h-1 bg-white/15'
                }`}
              />
            ))}
          </div>

          <p className="text-[13px] font-bold text-white mb-1">{t(step.titleKey)}</p>
          <p className="text-[12px] text-white/55 leading-relaxed mb-3">{t(step.bodyKey)}</p>

          <button
            onClick={advance}
            className="w-full h-9 flex items-center justify-between bg-[#f2f2f2] hover:bg-[#e8e8e8] active:scale-[0.98] rounded-xl transition-all pl-4 pr-1.5"
          >
            <span className="text-[11px] font-barlow-condensed font-bold uppercase tracking-[0.10em] text-[#080808]">
              {isLast ? t('tour.cta.ready') : t('tour.cta.understood')}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-black/[0.12]">
              <ArrowRight size={13} className="text-[#080808]" />
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
