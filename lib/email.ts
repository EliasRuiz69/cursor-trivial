import nodemailer from 'nodemailer'

function createTransport() {
  const host = process.env.EMAIL_SMTP_HOST
  const port = parseInt(process.env.EMAIL_SMTP_PORT ?? '587', 10)
  const user = process.env.EMAIL_SMTP_USER
  const pass = process.env.EMAIL_SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const from = process.env.EMAIL_FROM ?? 'Trivial Retro <noreply@trivialretro.com>'
  const transport = createTransport()

  if (!transport) {
    // Sin SMTP configurado: loguear el enlace para poder probarlo en desarrollo
    console.warn(
      '\n⚠️  EMAIL_SMTP_* no configurado. Enlace de reset (solo visible en servidor):\n' +
      `   → ${resetUrl}\n`
    )
    return
  }

  await transport.sendMail({
    from,
    to,
    subject: 'Recupera tu contraseña — Trivial Retro',
    text: `Hola,\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nHaz clic en el siguiente enlace (válido 30 minutos):\n${resetUrl}\n\nSi no solicitaste esto, ignora este mensaje.\n\n— Trivial Retro`,
    html: `
      <div style="font-family:monospace;max-width:480px;margin:0 auto;border:4px solid #2D2D2D;background:#FDFAF0;">
        <div style="background:#A8C8E8;border-bottom:4px solid #2D2D2D;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:8px;">🏛️ 🌍 🔢 🎬</div>
          <h1 style="margin:0;font-size:18px;color:#2D2D2D;">TRIVIAL RETRO</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin-top:0;">Hola,</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
          <p>Haz clic en el botón (el enlace expira en <strong>30 minutos</strong>):</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${resetUrl}" style="
              display:inline-block;
              background:#A8C8E8;
              border:4px solid #2D2D2D;
              padding:12px 24px;
              color:#2D2D2D;
              font-weight:bold;
              text-decoration:none;
              box-shadow:4px 4px 0 #2D2D2D;
            ">▶ Restablecer contraseña</a>
          </div>
          <p style="font-size:12px;color:#666;">
            Si no solicitaste esto, ignora este mensaje — tu contraseña no cambiará.
          </p>
        </div>
      </div>
    `,
  })
}
