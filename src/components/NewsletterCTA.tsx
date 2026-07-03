import { T } from '@/lib/tokens';
import { useSiteConfig } from '@/lib/siteConfig';

export function NewsletterCTA() {
  const { config } = useSiteConfig();

  return (
    <div className="page-pad" style={{
      paddingTop: 51, paddingBottom: 51,
      borderBottom: `1px solid ${T.rule}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 29, textAlign: 'center',
    }}>
      <div>
        <h2 style={{
          fontWeight: 700, fontSize: 29, letterSpacing: '-0.02em',
          color: T.ink, margin: 0, lineHeight: 1,
        }}>
          Stay in the loop
        </h2>
        <p style={{ fontSize: 13, color: T.inkSoft, marginTop: 11, marginBottom: 0 }}>
          Subscribe to the newsletter or join the conversation on WhatsApp or Telegram.
        </p>
      </div>
      <form
        action="https://assets.mailerlite.com/jsonp/2487537/forms/191964402954536333/subscribe"
        method="post"
        target="_blank"
        style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}
      >
        <input type="hidden" name="ml-submit" value="1" />
        <input type="hidden" name="anticsrf" value="true" />
        <input
          type="email"
          name="fields[email]"
          required
          placeholder="Your email"
          autoComplete="email"
          style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: 11,
            padding: '13px 14px',
            border: `1px solid ${T.rule}`,
            background: T.card,
            color: T.ink,
            minWidth: 192,
          }}
        />
        <button type="submit" style={{
          background: T.ink, color: T.limestone,
          padding: '13px 19px', fontWeight: 600, fontSize: 11,
          fontFamily: '"Space Grotesk", sans-serif',
          border: 'none', cursor: 'pointer',
        }}>
          Subscribe →
        </button>
      </form>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {config.whatsappUrl && (
          <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" style={{
            background: '#25D366', color: '#fff',
            padding: '13px 19px', fontWeight: 600, fontSize: 11,
            fontFamily: '"Space Grotesk", sans-serif',
            textDecoration: 'none', display: 'inline-block',
          }}>
            WhatsApp →
          </a>
        )}
        {config.telegramUrl && (
          <a href={config.telegramUrl} target="_blank" rel="noopener noreferrer" style={{
            background: '#229ED9', color: '#fff',
            padding: '13px 19px', fontWeight: 600, fontSize: 11,
            fontFamily: '"Space Grotesk", sans-serif',
            textDecoration: 'none', display: 'inline-block',
          }}>
            Telegram →
          </a>
        )}
      </div>
    </div>
  );
}
