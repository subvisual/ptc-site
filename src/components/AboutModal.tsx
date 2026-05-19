import { useState } from 'react';
import { SITE } from '@/lib/tokens';
import { SiteConfig } from '@/lib/siteConfig';

interface AboutModalProps {
  config: SiteConfig;
  onClose: () => void;
}

export function AboutModal({ config, onClose }: AboutModalProps) {
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
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(26,26,26,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: SITE.paper, maxWidth: 640, width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
          border: `1px solid ${SITE.rule}`,
          fontFamily: '"Space Grotesk", sans-serif',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '28px 32px 0',
        }}>
          <div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              color: SITE.green, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8,
            }}>
              About
            </div>
            <h2 style={{ fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em', color: SITE.ink, margin: 0 }}>
              Portuguese Tech Communities
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: SITE.mute, padding: 4, lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* About text */}
        <div style={{ padding: '20px 32px', borderBottom: `1px solid ${SITE.rule}` }}>
          <p style={{ color: SITE.inkSoft, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            {config.aboutText}
          </p>
        </div>

        {/* Links */}
        {(socialLinks.length > 0 || communityLinks.length > 0 || config.newsletterUrl) && (
          <div style={{ padding: '20px 32px', borderBottom: `1px solid ${SITE.rule}` }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14,
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

        {/* FAQs */}
        {config.faqs.length > 0 && (
          <div style={{ padding: '20px 32px', borderBottom: `1px solid ${SITE.rule}` }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14,
            }}>
              FAQ
            </div>
            {config.faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: i < config.faqs.length - 1 ? `1px solid ${SITE.rule}` : 'none' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    padding: '12px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: 12,
                    fontFamily: '"Space Grotesk", sans-serif', fontSize: 14, fontWeight: 600,
                    color: SITE.ink,
                  }}
                >
                  {faq.q}
                  <span style={{ color: SITE.mute, fontSize: 12, flexShrink: 0 }}>
                    {openFaq === i ? '▴' : '▾'}
                  </span>
                </button>
                {openFaq === i && (
                  <p style={{ color: SITE.inkSoft, fontSize: 14, lineHeight: 1.55, margin: '0 0 12px' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact */}
        <div style={{ padding: '20px 32px' }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14,
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
            <p style={{ color: SITE.mute, fontSize: 13, margin: 0 }}>
              Em breve.
            </p>
          )}
        </div>
      </div>
    </div>
  );
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
