'use client'

import { useEffect } from 'react'

// Clé localStorage utilisée par SessionLogger pour détecter une séance active
const DRAFT_KEY_PREFIX = 'draft_session_log_id_'

function hasActiveDraft(): boolean {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(DRAFT_KEY_PREFIX)) return true
  }
  return false
}

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/client' })
      .catch(() => {
        // SW registration failed silently — app still works without it
      })

    // Recharger automatiquement quand un nouveau SW prend le contrôle
    // Sauf si une séance est en cours (draft présent en localStorage)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hasActiveDraft()) {
        window.location.reload()
      }
    })
  }, [])

  return null
}
