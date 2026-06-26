const base = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Equity Table</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-.3px;">Equity Table</span>
          </td>
        </tr>
        <tr><td style="padding:32px;">${content}</td></tr>
        <tr>
          <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
              &copy; ${new Date().getFullYear()} Equity Table. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#0f172a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">${label}</a>`

export function tableInviteEmail({
  inviterName,
  tableName,
  inviteLink,
  role,
}: {
  inviterName: string
  tableName: string
  inviteLink: string
  role: string
}) {
  return {
    subject: `${inviterName} invited you to join ${tableName}`,
    html: base(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#0f172a;">You're invited to an Equity Table</h2>
      <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
        <strong>${inviterName}</strong> has invited you to join <strong>${tableName}</strong> as a <strong>${role}</strong>.
        Equity Table is a financial literacy platform where groups learn, save, and build wealth together.
      </p>
      <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">
        Click below to accept the invitation and get started:
      </p>
      ${btn(inviteLink, 'Accept Invitation')}
      <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;">
        Or copy this link: <a href="${inviteLink}" style="color:#0f172a;">${inviteLink}</a>
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">This invitation expires in 7 days.</p>
    `),
  }
}

export function welcomeEmail({ name, appUrl }: { name: string; appUrl: string }) {
  return {
    subject: 'Welcome to Equity Table',
    html: base(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Welcome, ${name}!</h2>
      <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
        Your account is confirmed and ready to go. Equity Table helps you and your community
        build financial literacy, track savings goals, and grow wealth together.
      </p>
      <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">
        Get started by creating your first table or joining one you've been invited to.
      </p>
      ${btn(appUrl, 'Go to Equity Table')}
    `),
  }
}

export function passwordResetEmail({ resetLink }: { resetLink: string }) {
  return {
    subject: 'Reset your Equity Table password',
    html: base(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Reset your password</h2>
      <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
        We received a request to reset the password for your Equity Table account.
        Click below to choose a new password.
      </p>
      ${btn(resetLink, 'Reset Password')}
      <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;">
        If you didn't request this, you can safely ignore this email.
        This link expires in 1 hour.
      </p>
    `),
  }
}

export function goalMilestoneEmail({
  name,
  goalName,
  percent,
  appUrl,
}: {
  name: string
  goalName: string
  percent: number
  appUrl: string
}) {
  return {
    subject: `You've hit ${percent}% on "${goalName}"`,
    html: base(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Keep going, ${name}!</h2>
      <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
        You've reached <strong>${percent}%</strong> of your savings goal <strong>"${goalName}"</strong>.
        You're making real progress — stay consistent and you'll hit your target.
      </p>
      ${btn(appUrl, 'View My Goals')}
    `),
  }
}
