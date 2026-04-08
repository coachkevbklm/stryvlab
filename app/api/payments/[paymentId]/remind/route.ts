import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── POST /api/payments/[paymentId]/remind ────────────────────────────────────
// Manual payment reminder: sends an email to the client for a pending payment.
export async function POST(
  _req: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const db = serviceClient()

  // Fetch payment with subscription + formula
  const { data: payment } = await db
    .from('subscription_payments')
    .select(`
      id, amount_eur, payment_date, status, client_id,
      subscription:client_subscriptions(
        formula:coach_formulas(name)
      )
    `)
    .eq('id', params.paymentId)
    .eq('coach_id', user.id)
    .single()

  if (!payment) return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 })
  if (payment.status !== 'pending') {
    return NextResponse.json({ error: 'Ce paiement n\'est pas en attente' }, { status: 400 })
  }

  const { data: client } = await db
    .from('coach_clients')
    .select('first_name, last_name, email')
    .eq('id', payment.client_id)
    .single()

  if (!client?.email) {
    return NextResponse.json({ error: 'Le client n\'a pas d\'adresse email' }, { status: 400 })
  }

  const coachMeta = user.user_metadata ?? {}
  const coachName: string = coachMeta.full_name ?? coachMeta.first_name ?? user.email ?? 'Votre coach'

  const dueDateFormatted = new Date(payment.payment_date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = payment.subscription as any
  const formulaName: string = sub?.formula?.name ?? 'Coaching'
  const amount = Number(payment.amount_eur)

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.privateemail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  const FROM = `${coachName} <${process.env.SMTP_USER}>`
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stryvlab.com'
  const ACCENT = '#1f8a65'

  await transporter.sendMail({
    from: FROM,
    to: client.email,
    subject: `Rappel paiement — ${formulaName} — ${amount.toFixed(2)} €`,
    html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f5f5f5;margin:0;padding:40px 16px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="background:#1a1a1a;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;">
      <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${coachName}</span>
    </div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:40px;">
      <p style="font-size:16px;color:#1a1a1a;margin:0 0 8px;font-weight:600;">Bonjour ${client.first_name ?? ''},</p>
      <p style="font-size:15px;color:#555;margin:0 0 24px;line-height:1.6;">
        Votre coach <strong>${coachName}</strong> vous rappelle qu'un paiement est attendu pour votre formule <strong>${formulaName}</strong>.
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
            <td style="color:#999;padding:4px 0;">Échéance</td>
            <td style="color:${ACCENT};font-weight:600;">${dueDateFormatted}</td>
          </tr>
        </table>
      </div>
      <p style="font-size:12px;color:#999;margin:0;">Pour toute question, répondez directement à cet email ou contactez votre coach.</p>
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
    .eq('id', params.paymentId)

  return NextResponse.json({ sent: true })
}
