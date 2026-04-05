'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (msg.includes('Email not confirmed')) return 'Votre email n\'a pas encore été confirmé.'
  if (msg.includes('Password should be at least 6 characters')) return 'Le mot de passe doit contenir au moins 6 caractères.'
  if (msg.includes('User already registered')) return 'Un compte existe déjà avec cet email.'
  return 'Une erreur est survenue. Veuillez réessayer.'
}

export async function clientLogin(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Email et mot de passe requis.' }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: translateError(error.message) }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function clientSignup(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  if (!email || !password || !name) return { error: 'Tous les champs sont requis.' }
  if (password.length < 6) return { error: 'Le mot de passe doit contenir au moins 6 caractères.' }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/client/auth/confirm`,
    },
  })

  if (error) return { error: translateError(error.message) }

  // Link userId to existing Client record (matched by email)
  if (data.user) {
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await service
      .from('coach_clients')
      .update({ user_id: data.user.id })
      .eq('email', email)
      .is('user_id', null)
  }

  revalidatePath('/', 'layout')
  return { success: true, emailConfirmation: true }
}
