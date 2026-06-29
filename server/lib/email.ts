import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendMagicLink(to: string, token: string, communityNames: string[]) {
  const resend = getResend();
  const FROM = process.env.RESEND_FROM ?? 'noreply@ptc.pt';
  const siteUrl = process.env.SITE_URL ?? 'http://localhost:5173';
  const link = `${siteUrl}/api/portal/auth/${token}`;
  const names = communityNames.join(', ');

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Acesso ao portal PTC — ${names}`,
    html: `
      <div style="font-family: 'Space Grotesk', sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <p style="font-size: 13px; color: #6e6a5e; letter-spacing: 0.1em; text-transform: uppercase; font-family: monospace;">Portuguese Tech Communities</p>
        <h1 style="font-size: 22px; font-weight: 700; margin: 8px 0 24px;">Acesso ao portal de comunidade</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Clica no botão abaixo para aceder ao dashboard de <strong>${names}</strong>.<br>
          O link é válido por 24 horas e expira após ser usado.
        </p>
        <a href="${link}" style="display: inline-block; margin: 24px 0; background: #1a1a1a; color: #f4f1e8; padding: 14px 28px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Entrar no portal →
        </a>
        <p style="font-size: 12px; color: #6e6a5e; margin-top: 32px;">
          Se não pediste este acesso, ignora este email.<br>
          <a href="${link}" style="color: #6e6a5e; word-break: break-all;">${link}</a>
        </p>
      </div>
    `,
  });
}
