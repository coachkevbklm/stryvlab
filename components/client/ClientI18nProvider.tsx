'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { type ClientLang, ct, ctp, cta, type ClientDictKey } from '@/lib/i18n/clientTranslations'

interface ClientI18nContextType {
  lang: ClientLang
  t: (key: ClientDictKey, vars?: Record<string, string | number>) => string
  tp: (key: ClientDictKey, n: number) => string
  ta: (key: ClientDictKey) => string[]
}

const ClientI18nContext = createContext<ClientI18nContextType>({
  lang: 'fr',
  t: (key, vars) => ct('fr', key, vars),
  tp: (key, n) => ctp('fr', key, n),
  ta: (key) => cta('fr', key),
})

export function ClientI18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<ClientLang>('fr')

  useEffect(() => {
    // Try localStorage first (instant, no flash)
    const stored = localStorage.getItem('client_lang') as ClientLang | null
    if (stored && ['fr', 'en', 'es'].includes(stored)) {
      setLang(stored)
    }
    // Then sync from DB (authoritative)
    fetch('/api/client/preferences')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const dbLang = data?.preferences?.language as ClientLang | undefined
        if (dbLang && ['fr', 'en', 'es'].includes(dbLang)) {
          setLang(dbLang)
          localStorage.setItem('client_lang', dbLang)
        }
      })
      .catch(() => {/* silent — keep stored/default */})
  }, [])

  const value: ClientI18nContextType = {
    lang,
    t: (key, vars) => ct(lang, key, vars),
    tp: (key, n) => ctp(lang, key, n),
    ta: (key) => cta(lang, key),
  }

  return (
    <ClientI18nContext.Provider value={value}>
      {children}
    </ClientI18nContext.Provider>
  )
}

export function useClientT() {
  return useContext(ClientI18nContext)
}
