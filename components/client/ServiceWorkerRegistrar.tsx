'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/client' })
        .catch(() => {
          // SW registration failed silently — app still works without it
        })
    }
  }, [])
  return null
}
