import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// ─── POST /api/cron/payment-reminders ─────────────────────────────────────────
// Called by n8n (or Vercel Cron) daily.
// Sends reminder emails for pending payments due in 3 days.
// Protected by CRON_SECRET header.

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const METHOD_LABELS: Record<string, string> = {
  manual: 'Manuel', bank_transfer: 'Virement bancaire', card: 'Carte bancaire',
  cash: 'Espèces', stripe: 'Stripe', other: 'Autre',
}

export async function POST(req: NextRequest) {
  // Auth: verify cron secret
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = serviceClient()
  const today = new Date()

  // Fetch all coach profiles that have reminders enabled
  const { data: profiles } = await db
    .from('coach_profiles')
    .select('coach_id, notif_payment_reminder, notif_payment_reminder_days')
    .eq('notif_payment_reminder', true)

  // Build a map: coach_id → target payment_date (today + days)
  const coachTargetDates: Record<string, string> = {}
  const defaultDays = 3

  if (profiles && profiles.length > 0) {
    for (const p of profiles) {
      const days = p.notif_payment_reminder_days ?? defaultDays
      const target = new Date(today)
      target.setDate(target.getDate() + days)
      coachTargetDates[p.coach_id] = target.toISOString().split('T')[0]
    }
  }

  // Also cover coaches with no profile (use default J-3)
  const defaultTargetDate = new Date(today)
  defaultTargetDate.setDate(defaultTargetDate.getDate() + defaultDays)
  const defaultTargetDateStr = defaultTargetDate.toISOString().split('T')[0]

  // Fetch all pending payments not yet reminded, due within J-1 to J-7 window
  const maxTarget = new Date(today)
  maxTarget.setDate(maxTarget.getDate() + 7)
  const minTarget = new Date(today)
  minTarget.setDate(minTarget.getDate() + 1)

  const { data: payments, error } = await db
    .from('subscription_payments')
    .select(`
      id, amount_eur, payment_date, payment_method, coach_id, client_id,
      subscription:client_subscriptions(
        formula:coach_formulas(name)
      )
    `)
    .eq('status', 'pending')
    .gte('payment_date', minTarget.toISOString().split('T')[0])
    .lte('payment_date', maxTarget.toISOString().split('T')[0])
    .is('reminder_sent_at', null)

  if (error) {
    console.error('[cron/payment-reminders] DB error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!payments || payments.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No payments due in window' })
  }

  // Filter: only send if payment_date matches coach's configured delay
  const filteredPayments = payments.filter(p => {
    const targetDate = coachTargetDates[p.coach_id] ?? defaultTargetDateStr
    return p.payment_date === targetDate
  })

  if (filteredPayments.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No payments matching coach reminder settings' })
  }

  // Group by coach to fetch coach info once per coach
  const coachIds = Array.from(new Set(filteredPayments.map(p => p.coach_id)))
  const coachMap: Record<string, { name: string; email: string }> = {}

  for (const coachId of coachIds) {
    const { data: coachUser } = await db.auth.admin.getUserById(coachId)
    if (coachUser?.user) {
      const meta = coachUser.user.user_metadata ?? {}
      coachMap[coachId] = {
        name: meta.full_name ?? meta.first_name ?? coachUser.user.email ?? 'Votre coach',
        email: coachUser.user.email ?? '',
      }
    }
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.privateemail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stryvlab.com'
  const ACCENT = '#1f8a65'

  let sentCount = 0
  const errors: string[] = []

  for (const payment of filteredPayments) {
    try {
      const { data: client } = await db
        .from('coach_clients')
        .select('first_name, last_name, email')
        .eq('id', payment.client_id)
        .single()

      if (!client?.email) continue

      const coach = coachMap[payment.coach_id] ?? { name: 'Votre coach', email: '' }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = payment.subscription as any
      const formulaName: string = sub?.formula?.name ?? 'Coaching'
      const amount = Number(payment.amount_eur)
      const dueDateFormatted = new Date(payment.payment_date).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })

      await transporter.sendMail({
        from: `${coach.name} <${process.env.SMTP_USER}>`,
        to: client.email,
        subject: `Rappel paiement — ${formulaName} — ${amount.toFixed(2)} €`,
        html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f5f5f5;margin:0;padding:40px 16px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="background:#1a1a1a;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;">
      <span style="font-size:22px;font-weight:800;color:#ffffff;">${coach.name}</span>
    </div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:40px;">
      <p style="font-size:16px;color:#1a1a1a;margin:0 0 8px;font-weight:600;">Bonjour ${client.first_name ?? ''},</p>
      <p style="font-size:15px;color:#555;margin:0 0 24px;line-height:1.6;">
        Votre coach <strong>${coach.name}</strong> vous rappelle qu'un paiement est attendu dans 3 jours pour votre formule <strong>${formulaName}</strong>.
      </p>
      <div style="background:#f9f9f9;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <td style="color:#999;padding:4px 0;width:40%;">Formule</td>
            <td style="color:#1a1a1a;font-weight:600;">${formulaName}</td>
          </tr>
          <tr>
            <td style="color:#999;padding:4px 0;">Montant dû</td>
            <td style="color:#1a1a1a;font-weight:700;font-family:monospace;">${amount.toFixed(2)} €</td>
          </tr>
          <tr>
            <td style="color:#999;padding:4px 0;">Méthode habituelle</td>
            <td style="color:#1a1a1a;">${METHOD_LABELS[payment.payment_method] ?? payment.payment_method}</td>
          </tr>
          <tr>
            <td style="color:#999;padding:4px 0;">Échéance</td>
            <td style="color:${ACCENT};font-weight:600;">${dueDateFormatted}</td>
          </tr>
        </table>
      </div>
      <p style="font-size:12px;color:#999;margin:0;">Pour toute question, répondez à cet email ou contactez votre coach directement.</p>
    </div>
    <p style="text-align:center;font-size:11px;color:#aaa;margin:20px 0 0;">
      Généré avec <a href="${SITE_URL}" style="color:#aaa;text-decoration:none;">STRYVR</a>
    </p>
  </div>
</body>
</html>`,
      })

      // Mark reminder sent
      await db
        .from('subscription_payments')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', payment.id)

      sentCount++
    } catch (err) {
      console.error(`[cron] Failed for payment ${payment.id}:`, err)
      errors.push(payment.id)
    }
  }

  return NextResponse.json({
    sent: sentCount,
    errors: errors.length > 0 ? errors : undefined,
  })
}
