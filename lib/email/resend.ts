import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL || 'STRYV Coach <noreply@stryvlab.com>'

export interface SendBilanEmailParams {
  to: string
  clientFirstName: string
  templateName: string
  bilanUrl: string
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
  const { to, clientFirstName, templateName, bilanUrl, expiresAt } = params

  const expiryFormatted = expiresAt.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Votre bilan "${templateName}" est prêt`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Inter, sans-serif; background: #f2f2f2; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <div style="background: #1a1a2e; padding: 32px 40px; text-align: center;">
      <img src="https://stryvlab.com/logo.png" alt="STRYV" width="40" height="40" style="width:40px;height:40px;object-fit:cover;border-radius:8px;display:inline-block;vertical-align:middle;margin-right:12px;" />
      <span style="font-size: 22px; font-weight: 800; color: white; letter-spacing: -0.5px; vertical-align: middle;">STRYV</span>
      <span style="font-size: 12px; font-weight: 400; color: #a0a0b0; margin-left: 8px; vertical-align: middle;">Coach</span>
    </div>
    <div style="padding: 40px;">
      <p style="font-size: 16px; color: #1a1a2e; margin: 0 0 8px;">Bonjour ${clientFirstName},</p>
      <p style="font-size: 15px; color: #555; margin: 0 0 24px; line-height: 1.6;">
        Votre coach vous a envoyé un bilan à remplir : <strong>${templateName}</strong>.
      </p>
      <a href="${bilanUrl}" style="display: inline-block; background: #6c63ff; color: white; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; margin-bottom: 24px;">
        Remplir mon bilan →
      </a>
      <p style="font-size: 12px; color: #999; margin: 0;">
        Ce lien expire le ${expiryFormatted}. Si vous ne souhaitez pas remplir ce bilan, ignorez ce message.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 11px; color: #bbb; margin: 0;">
        Lien direct : <a href="${bilanUrl}" style="color: #6c63ff;">${bilanUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
}

export async function sendBilanCompletedEmail(params: SendBilanCompletedEmailParams) {
  const { to, coachFirstName, clientFullName, templateName, dashboardUrl } = params

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${clientFullName} a complété son bilan`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Inter, sans-serif; background: #f2f2f2; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <div style="background: #1a1a2e; padding: 32px 40px; text-align: center;">
      <img src="https://stryvlab.com/logo.png" alt="STRYV" width="40" height="40" style="width:40px;height:40px;object-fit:cover;border-radius:8px;display:inline-block;vertical-align:middle;margin-right:12px;" />
      <span style="font-size: 22px; font-weight: 800; color: white; letter-spacing: -0.5px; vertical-align: middle;">STRYV</span>
      <span style="font-size: 12px; font-weight: 400; color: #a0a0b0; margin-left: 8px; vertical-align: middle;">Coach</span>
    </div>
    <div style="padding: 40px;">
      <p style="font-size: 16px; color: #1a1a2e; margin: 0 0 8px;">Bonjour ${coachFirstName},</p>
      <p style="font-size: 15px; color: #555; margin: 0 0 24px; line-height: 1.6;">
        <strong>${clientFullName}</strong> vient de compléter le bilan <strong>${templateName}</strong>.
      </p>
      <a href="${dashboardUrl}" style="display: inline-block; background: #6c63ff; color: white; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; margin-bottom: 24px;">
        Voir le bilan →
      </a>
      <p style="font-size: 12px; color: #999; margin: 0;">
        Connectez-vous à votre espace coach pour consulter les réponses et les métriques.
      </p>
    </div>
  </div>
</body>
</html>`,
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
}
