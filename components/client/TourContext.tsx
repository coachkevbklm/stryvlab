'use client'

import { createContext, useContext, useState } from 'react'

interface TourContextValue {
  highlightedNavIndex: number | null
  setHighlightedNavIndex: (index: number | null) => void
}

const TourContext = createContext<TourContextValue>({
  highlightedNavIndex: null,
  setHighlightedNavIndex: () => {},
})

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [highlightedNavIndex, setHighlightedNavIndex] = useState<number | null>(null)
  return (
    <TourContext.Provider value={{ highlightedNavIndex, setHighlightedNavIndex }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  return useContext(TourContext)
}
