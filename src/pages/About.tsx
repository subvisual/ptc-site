import { useState } from 'react';
import { SITE, T } from '@/lib/tokens';
import { NavBar, Page } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { useSiteConfig } from '@/lib/siteConfig';

interface AboutProps {
  onNavigate: (page: Page) => void;
  onOpenSubmit?: () => void;
  onOpenAdmin?: () => void;
}

function linkChipStyle(color: string): React.CSSProperties {
  return {
    fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    padding: '6px 14px',
    color,
    border: `1px solid ${color}`,
    textDecoration: 'none',
    display: 'inline-block',
  };
}

export function About({ onNavigate, onOpenSubmit, onOpenAdmin }: AboutProps) {
  const { config } = useSiteConfig();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const socialLinks = [
    { label: 'Twitter / X', url: config.twitterUrl },
    { label: 'LinkedIn', url: config.linkedinUrl },
    { label: 'Instagram', url: config.instagramUrl },
  ].filter(s => s.url);

  const communityLinks = [
    { label: 'WhatsApp', url: config.whatsappUrl },
    { label: 'Telegram', url: config.telegramUrl },
  ].filter(l => l.url);

  return (
    <div style={{ background: T.paper, minHeight: '100vh', fontFamily: '"Space Grotesk", sans-serif', display: 'flex', flexDirection: 'column' }}>
      <NavBar active="home" onNavigate={onNavigate} onOpenSubmit={onOpenSubmit} />

      <div className="page-pad" style={{ paddingTop: 40, paddingBottom: 24 }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
          color: T.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8,
        }}>
          About
        </div>
        <h1 style={{ fontWeight: 700, fontSize: 42, letterSpacing: '-0.02em', color: T.ink, margin: 0 }}>
          Portuguese Tech Communities
        </h1>
      </div>

      <div className="page-pad" style={{ paddingBottom: 64, maxWidth: 760, flex: 1 }}>
        <p style={{ color: T.inkSoft, fontSize: 16, lineHeight: 1.65, marginTop: 24 }}>
          {config.aboutText}
        </p>

        <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${T.rule}` }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            color: T.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Links
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <form
              action="https://assets.mailerlite.com/jsonp/2487537/forms/191964402954536333/subscribe"
              method="post"
              target="_blank"
              style={{ display: 'flex' }}
            >
              <input type="hidden" name="ml-submit" value="1" />
              <input type="hidden" name="anticsrf" value="true" />
              <input
                type="email"
                name="fields[email]"
                required
                placeholder="Email for newsletter"
                style={{
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                  letterSpacing: '0.05em',
                  padding: '6px 12px',
                  border: `1px solid ${SITE.green}`,
                  borderRight: 'none',
                  background: 'transparent',
                  color: T.ink,
                  width: 170,
                }}
              />
              <button type="submit" style={{ ...linkChipStyle(SITE.green), borderLeft: 'none', background: 'none', cursor: 'pointer' }}>
                Newsletter →
              </button>
            </form>
            {communityLinks.map(l => (
              <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={linkChipStyle(T.ink as string)}>
                {l.label} →
              </a>
            ))}
            {socialLinks.map(l => (
              <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={linkChipStyle(T.mute as string)}>
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {config.faqs.length > 0 && (
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${T.rule}` }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              color: T.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
            }}>
              FAQ
            </div>
            {config.faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: i < config.faqs.length - 1 ? `1px solid ${T.rule}` : 'none' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    padding: '16px 0', cursor: 'pointer', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center', gap: 12,
                    fontFamily: '"Space Grotesk", sans-serif', fontSize: 15, fontWeight: 600,
                    color: T.ink,
                  }}
                >
                  {faq.q}
                  <span style={{ color: T.mute, fontSize: 12, flexShrink: 0 }}>
                    {openFaq === i ? '▴' : '▾'}
                  </span>
                </button>
                {openFaq === i && (
                  <p style={{ color: T.inkSoft, fontSize: 15, lineHeight: 1.6, margin: '0 0 16px' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${T.rule}` }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            color: T.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Contact
          </div>
          {config.contactFormUrl ? (
            <a
              href={config.contactFormUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                background: T.ink, color: T.limestone,
                padding: '12px 20px', fontSize: 13, fontWeight: 600,
                textDecoration: 'none', fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              Contact form →
            </a>
          ) : (
            <p style={{ color: T.mute, fontSize: 13, margin: 0 }}>Coming soon.</p>
          )}
        </div>
      </div>

      <Footer onOpenAdmin={onOpenAdmin} />
    </div>
  );
}
