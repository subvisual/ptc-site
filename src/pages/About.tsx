import { useState } from 'react';
import { SITE } from '@/lib/tokens';
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
    <div style={{ background: SITE.paper, minHeight: '100%', fontFamily: '"Space Grotesk", sans-serif' }}>
      <NavBar active="home" onNavigate={onNavigate} onOpenSubmit={onOpenSubmit} />

      <div style={{ padding: '40px 48px 24px' }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
          color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8,
        }}>
          About
        </div>
        <h1 style={{ fontWeight: 700, fontSize: 42, letterSpacing: '-0.02em', color: SITE.ink, margin: 0 }}>
          Portuguese Tech Communities
        </h1>
      </div>

      <div style={{ padding: '0 48px 64px', maxWidth: 760 }}>
        <p style={{ color: SITE.inkSoft, fontSize: 16, lineHeight: 1.65, marginTop: 24 }}>
          {config.aboutText}
        </p>

        {(socialLinks.length > 0 || communityLinks.length > 0 || config.newsletterUrl) && (
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${SITE.rule}` }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
            }}>
              Links
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {config.newsletterUrl && (
                <a href={config.newsletterUrl} target="_blank" rel="noreferrer" style={linkChipStyle(SITE.green)}>
                  Newsletter →
                </a>
              )}
              {communityLinks.map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={linkChipStyle(SITE.ink)}>
                  {l.label} →
                </a>
              ))}
              {socialLinks.map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={linkChipStyle(SITE.mute)}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {config.faqs.length > 0 && (
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${SITE.rule}` }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
            }}>
              FAQ
            </div>
            {config.faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${SITE.rule}` }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    padding: '16px 0', cursor: 'pointer', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center', gap: 12,
                    fontFamily: '"Space Grotesk", sans-serif', fontSize: 15, fontWeight: 600,
                    color: SITE.ink,
                  }}
                >
                  {faq.q}
                  <span style={{ color: SITE.mute, fontSize: 12, flexShrink: 0 }}>
                    {openFaq === i ? '▴' : '▾'}
                  </span>
                </button>
                {openFaq === i && (
                  <p style={{ color: SITE.inkSoft, fontSize: 15, lineHeight: 1.6, margin: '0 0 16px' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${SITE.rule}` }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Contacto
          </div>
          {config.contactFormUrl ? (
            <a
              href={config.contactFormUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                background: SITE.ink, color: SITE.limestone,
                padding: '12px 20px', fontSize: 13, fontWeight: 600,
                textDecoration: 'none', fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              Formulário de contacto →
            </a>
          ) : (
            <p style={{ color: SITE.mute, fontSize: 13, margin: 0 }}>Em breve.</p>
          )}
        </div>
      </div>

      <Footer onOpenAdmin={onOpenAdmin} />
    </div>
  );
}
