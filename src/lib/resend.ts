import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

const emailFrom = process.env.EMAIL_FROM || 'noreply@yourdomain.com'
const baseUrl = process.env.NEXTAUTH_URL || 'https://nobet.kz'

export async function sendVerificationEmail(email: string, token: string) {
  if (!resend) {
    console.log(`[DEV] Verification link: ${baseUrl}/verify-email?token=${token}`)
    return
  }

  await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: 'Подтвердите ваш email — AI против лудомании',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background: #1a1f2e; color: #e2e8f0; padding: 32px; border-radius: 12px;">
        <h2 style="color: #22c55e; margin-bottom: 16px;">Подтверждение email</h2>
        <p>Вы зарегистрировались на платформе <strong>AI против лудомании</strong>.</p>
        <p>Нажмите кнопку ниже, чтобы подтвердить ваш email:</p>
        <a href="${baseUrl}/verify-email?token=${token}"
           style="display: inline-block; background: #22c55e; color: #1a1f2e; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Подтвердить email
        </a>
        <p style="color: #94a3b8; font-size: 14px;">Если вы не регистрировались, просто проигнорируйте это письмо.</p>
      </div>
    `,
  })
}

export async function sendResetPasswordEmail(email: string, token: string) {
  if (!resend) {
    console.log(`[DEV] Reset password link: ${baseUrl}/reset-password?token=${token}`)
    return
  }

  await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: 'Сброс пароля — AI против лудомании',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background: #1a1f2e; color: #e2e8f0; padding: 32px; border-radius: 12px;">
        <h2 style="color: #22c55e; margin-bottom: 16px;">Сброс пароля</h2>
        <p>Вы запросили сброс пароля на платформе <strong>AI против лудомании</strong>.</p>
        <p>Нажмите кнопку ниже, чтобы создать новый пароль:</p>
        <a href="${baseUrl}/reset-password?token=${token}"
           style="display: inline-block; background: #22c55e; color: #1a1f2e; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Сбросить пароль
        </a>
        <p style="color: #94a3b8; font-size: 14px;">Ссылка действительна 1 час. Если вы не запрашивали сброс, проигнорируйте это письмо.</p>
      </div>
    `,
  })
}
