'use client'

import { useState } from 'react'
import { KeyRound, Check, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function PasswordResetButton({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleReset() {
    setState('sending')
    setErrorMsg(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/client/auth/reset-password`,
    })

    if (error) {
      setErrorMsg(error.message)
      setState('error')
    } else {
      setState('sent')
    }
  }

  if (state === 'sent') {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
        <Check size={16} className="text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-700">Email envoyé</p>
          <p className="text-xs text-green-600">Vérifie ta boîte mail ({email})</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-sm text-primary font-medium">Changer le mot de passe</p>
          <p className="text-[10px] text-secondary">Un email de réinitialisation sera envoyé à {email}</p>
        </div>
        <button
          onClick={handleReset}
          disabled={state === 'sending'}
          className="flex items-center gap-1.5 px-3 py-2 bg-surface-light shadow-soft-out rounded-lg text-xs font-semibold text-secondary hover:text-primary transition-colors disabled:opacity-50 shrink-0 ml-3"
        >
          {state === 'sending'
            ? <Loader2 size={13} className="animate-spin" />
            : <KeyRound size={13} />
          }
          {state === 'sending' ? 'Envoi…' : 'Envoyer'}
        </button>
      </div>

      {state === 'error' && errorMsg && (
        <div className="flex items-center gap-2 text-xs text-red-500">
          <AlertCircle size={12} />
          {errorMsg}
        </div>
      )}
    </div>
  )
}
