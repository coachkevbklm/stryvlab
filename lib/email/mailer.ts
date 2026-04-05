import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.privateemail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = `STRYV Coach <${process.env.SMTP_USER || 'noreply@stryvlab.com'}>`
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stryvlab.com'
const LOGO_URL = `${SITE_URL}/logo.png`

// Brand tokens
const BRAND_BG = '#1A1A1A'
const BRAND_ACCENT = '#0e8c5b'

function emailTemplate({ body }: { body: string }): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 16px;">
  <div style="max-width: 520px; margin: 0 auto;">
    <!-- Header -->
    <div style="background: ${BRAND_BG}; border-radius: 16px 16px 0 0; padding: 28px 40px; text-align: center;">
      <img src="${LOGO_URL}" alt="STRYV" width="48" height="48"
        style="width:48px;height:48px;object-fit:contain;display:inline-block;vertical-align:middle;margin-right:14px;" />
      <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; vertical-align: middle;">STRYV</span>
    </div>
    <!-- Body -->
    <div style="background: #ffffff; border-radius: 0 0 16px 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.07);">
      ${body}
    </div>
    <!-- Footer -->
    <p style="text-align: center; font-size: 11px; color: #aaa; margin: 20px 0 0;">
      © ${new Date().getFullYear()} STRYV — <a href="${SITE_URL}" style="color: #aaa; text-decoration: none;">stryvlab.com</a>
    </p>
  </div>
</body>
</html>`
}

export interface SendBilanEmailParams {
  to: string
  clientFirstName: string
  coachName: string | null
  templateName: string
  bilanUrl: string
  expiresAt: Date
}

export interface SendAccessLinkEmailParams {
  to: string
  clientFirstName: string
  coachName: string | null
  accessUrl: string
  expiresAt: Date
}

export interface SendBilanCompletedEmailParams {
  to: string
  coachFirstName: string
  clientFullName: string
  templateName: string
  dashboardUrl: string
}

export async function sendBilanEmail(params: SendBilanEmailParams) {
  const { to, clientFirstName, coachName, templateName, bilanUrl, expiresAt } = params

  const expiryFormatted = expiresAt.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const senderLine = coachName
    ? `Votre coach <strong>${coachName}</strong> vous a envoyé un bilan à remplir : <strong>${templateName}</strong>.`
    : `Votre coach vous a envoyé un bilan à remplir : <strong>${templateName}</strong>.`

  await transporter.sendMail({
    from: FROM,
    to,
    subject: coachName
      ? `${coachName} vous a envoyé un bilan — ${templateName}`
      : `Votre bilan "${templateName}" est prêt`,
    html: emailTemplate({
      body: `
      <p style="font-size: 16px; color: #1A1A1A; margin: 0 0 8px; font-weight: 600;">Bonjour ${clientFirstName},</p>
      <p style="font-size: 15px; color: #555; margin: 0 0 24px; line-height: 1.6;">
        ${senderLine}
      </p>
      <a href="${bilanUrl}" style="display: inline-block; background: ${BRAND_ACCENT}; color: white; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; margin-bottom: 24px;">
        Remplir mon bilan →
      </a>
      <p style="font-size: 12px; color: #999; margin: 0;">
        Ce lien expire le ${expiryFormatted}. Si vous ne souhaitez pas remplir ce bilan, ignorez ce message.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 11px; color: #bbb; margin: 0;">
        Lien direct : <a href="${bilanUrl}" style="color: ${BRAND_ACCENT};">${bilanUrl}</a>
      </p>`,
    }),
  })
}

export async function sendAccessLinkEmail(params: SendAccessLinkEmailParams) {
  const { to, clientFirstName, coachName, accessUrl, expiresAt } = params

  const expiryFormatted = expiresAt.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const senderLine = coachName
    ? `Votre coach <strong>${coachName}</strong> vous invite à accéder à votre espace personnel STRYV.`
    : `Votre coach vous invite à accéder à votre espace personnel STRYV.`

  await transporter.sendMail({
    from: FROM,
    to,
    subject: coachName
      ? `${coachName} vous invite sur STRYV`
      : 'Votre accès à STRYV est prêt',
    html: emailTemplate({
      body: `
      <p style="font-size: 16px; color: #1A1A1A; margin: 0 0 8px; font-weight: 600;">Bonjour ${clientFirstName},</p>
      <p style="font-size: 15px; color: #555; margin: 0 0 16px; line-height: 1.6;">
        ${senderLine}
      </p>
      <p style="font-size: 14px; color: #555; margin: 0 0 24px; line-height: 1.6;">
        Cliquez sur le bouton ci-dessous pour vous connecter en un clic — aucun mot de passe requis.
      </p>
      <a href="${accessUrl}" style="display: inline-block; background: ${BRAND_ACCENT}; color: white; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; margin-bottom: 24px;">
        Accéder à mon espace →
      </a>
      <p style="font-size: 12px; color: #999; margin: 0;">
        Ce lien expire le ${expiryFormatted}. Ne partagez pas cet email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 11px; color: #bbb; margin: 0;">
        Lien direct : <a href="${accessUrl}" style="color: ${BRAND_ACCENT};">${accessUrl}</a>
      </p>`,
    }),
  })
}

export interface SendPaymentReceiptEmailParams {
  to: string
  clientFirstName: string
  coachName: string | null
  amount: number
  description: string | null
  paymentDate: string
  reference: string | null
  method: string
}

export async function sendPaymentReceiptEmail(params: SendPaymentReceiptEmailParams) {
  const { to, clientFirstName, coachName, amount, description, paymentDate, reference, method } = params

  const dateFormatted = new Date(paymentDate).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const METHOD_LABELS: Record<string, string> = {
    manual: 'Manuel', bank_transfer: 'Virement bancaire', card: 'Carte bancaire',
    cash: 'Espèces', stripe: 'Stripe', other: 'Autre',
  }

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Reçu de paiement — ${amount.toFixed(2)} €`,
    html: emailTemplate({
      body: `
      <p style="font-size: 16px; color: #1A1A1A; margin: 0 0 8px; font-weight: 600;">Bonjour ${clientFirstName},</p>
      <p style="font-size: 15px; color: #555; margin: 0 0 24px; line-height: 1.6;">
        ${coachName ? `Votre coach <strong>${coachName}</strong> a enregistré` : 'Un'} paiement de <strong>${amount.toFixed(2)} €</strong> en date du ${dateFormatted}.
      </p>
      <div style="background: #f9f9f9; border: 1px solid #eee; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #999; padding: 4px 0; width: 40%;">Montant</td>
            <td style="color: #1A1A1A; font-weight: 700; font-family: monospace;">${amount.toFixed(2)} €</td>
          </tr>
          <tr>
            <td style="color: #999; padding: 4px 0;">Date</td>
            <td style="color: #1A1A1A;">${dateFormatted}</td>
          </tr>
          <tr>
            <td style="color: #999; padding: 4px 0;">Méthode</td>
            <td style="color: #1A1A1A;">${METHOD_LABELS[method] ?? method}</td>
          </tr>
          ${description ? `<tr><td style="color: #999; padding: 4px 0;">Description</td><td style="color: #1A1A1A;">${description}</td></tr>` : ''}
          ${reference ? `<tr><td style="color: #999; padding: 4px 0;">Référence</td><td style="color: #1A1A1A; font-family: monospace;">${reference}</td></tr>` : ''}
        </table>
      </div>
      <p style="font-size: 12px; color: #999; margin: 0;">
        Conservez cet email comme reçu de paiement. Pour toute question, contactez votre coach directement.
      </p>`,
    }),
  })
}

export async function sendBilanCompletedEmail(params: SendBilanCompletedEmailParams) {
  const { to, coachFirstName, clientFullName, templateName, dashboardUrl } = params

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `${clientFullName} a complété son bilan`,
    html: emailTemplate({
      body: `
      <p style="font-size: 16px; color: #1A1A1A; margin: 0 0 8px; font-weight: 600;">Bonjour ${coachFirstName},</p>
      <p style="font-size: 15px; color: #555; margin: 0 0 24px; line-height: 1.6;">
        <strong>${clientFullName}</strong> vient de compléter le bilan <strong>${templateName}</strong>.
      </p>
      <a href="${dashboardUrl}" style="display: inline-block; background: ${BRAND_ACCENT}; color: white; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; margin-bottom: 24px;">
        Voir le bilan →
      </a>
      <p style="font-size: 12px; color: #999; margin: 0;">
        Connectez-vous à votre espace coach pour consulter les réponses et les métriques.
      </p>`,
    }),
  })
}
