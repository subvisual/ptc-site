import { useState } from 'react';
import { SITE } from '@/lib/tokens';
import { SiteConfig, FAQ, useSiteConfig } from '@/lib/siteConfig';

interface AdminProps {
  onExit: () => void;
}

export function Admin({ onExit }: AdminProps) {
  const { config, setConfig } = useSiteConfig();
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<SiteConfig>({ ...config });

  function handleLogin() {
    if (passwordInput === config.adminPassword) {
      setDraft({ ...config });
      setAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  }

  function handleSave() {
    setConfig(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateFaq(i: number, field: keyof FAQ, value: string) {
    const faqs = draft.faqs.map((f, idx) => idx === i ? { ...f, [field]: value } : f);
    setDraft(prev => ({ ...prev, faqs }));
  }

  function addFaq() {
    setDraft(prev => ({ ...prev, faqs: [...prev.faqs, { q: '', a: '' }] }));
  }

  function removeFaq(i: number) {
    setDraft(prev => ({ ...prev, faqs: prev.faqs.filter((_, idx) => idx !== i) }));
  }

  if (!authenticated) {
    return (
      <div style={{
        background: SITE.paper, minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Space Grotesk", sans-serif',
      }}>
        <div style={{
          border: `1px solid ${SITE.rule}`, padding: 48, minWidth: 360, background: SITE.paper,
        }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            color: SITE.green, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Admin
          </div>
          <h1 style={{ fontWeight: 700, fontSize: 22, color: SITE.ink, margin: '0 0 28px' }}>
            Backoffice PTC
          </h1>
          <label style={{ display: 'block', fontSize: 12, color: SITE.mute, marginBottom: 8 }}>
            Password
          </label>
          <input
            type="password"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '10px 12px', fontSize: 14,
              border: `1px solid ${passwordError ? SITE.red : SITE.rule}`,
              fontFamily: '"Space Grotesk", sans-serif', background: '#fff',
              outline: 'none', boxSizing: 'border-box',
            }}
            autoFocus
          />
          {passwordError && (
            <div style={{ color: SITE.red, fontSize: 12, marginTop: 6 }}>Password incorreta.</div>
          )}
          <button
            onClick={handleLogin}
            style={{
              marginTop: 20, width: '100%', background: SITE.ink, color: SITE.limestone,
              padding: '12px 0', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            Entrar
          </button>
          <button
            onClick={onExit}
            style={{
              marginTop: 12, width: '100%', background: 'none',
              color: SITE.mute, padding: '10px 0', fontSize: 13, border: 'none', cursor: 'pointer',
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            ← Voltar ao site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: SITE.paper, minHeight: '100vh',
      fontFamily: '"Space Grotesk", sans-serif',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 48px', borderBottom: `1px solid ${SITE.rule}`, background: SITE.paper,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            onClick={onExit}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
              color: SITE.mute, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}
          >
            ← Site
          </button>
          <h1 style={{ fontWeight: 700, fontSize: 18, color: SITE.ink, margin: 0 }}>
            Backoffice PTC
          </h1>
        </div>
        <button
          onClick={handleSave}
          style={{
            background: saved ? SITE.green : SITE.ink, color: SITE.limestone,
            padding: '10px 24px', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer',
            fontFamily: '"Space Grotesk", sans-serif',
            transition: 'background 0.2s',
          }}
        >
          {saved ? 'Guardado ✓' : 'Guardar alterações'}
        </button>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 48px 80px' }}>

        {/* Forms */}
        <Section title="Formulários">
          <Field
            label="URL do form Submit yours (Notion / Typeform)"
            value={draft.notionFormUrl}
            onChange={v => setDraft(p => ({ ...p, notionFormUrl: v }))}
            placeholder="https://..."
          />
          <Field
            label="URL do form de contacto (Notion / Typeform)"
            value={draft.contactFormUrl}
            onChange={v => setDraft(p => ({ ...p, contactFormUrl: v }))}
            placeholder="https://..."
          />
        </Section>

        {/* About */}
        <Section title="Texto About">
          <Field
            label="Descrição"
            value={draft.aboutText}
            onChange={v => setDraft(p => ({ ...p, aboutText: v }))}
            multiline
          />
        </Section>

        {/* Links */}
        <Section title="Links & Redes Sociais">
          <Field label="Newsletter URL" value={draft.newsletterUrl} onChange={v => setDraft(p => ({ ...p, newsletterUrl: v }))} placeholder="https://..." />
          <Field label="WhatsApp URL" value={draft.whatsappUrl} onChange={v => setDraft(p => ({ ...p, whatsappUrl: v }))} placeholder="https://chat.whatsapp.com/..." />
          <Field label="Telegram URL" value={draft.telegramUrl} onChange={v => setDraft(p => ({ ...p, telegramUrl: v }))} placeholder="https://t.me/..." />
          <Field label="Twitter / X URL" value={draft.twitterUrl} onChange={v => setDraft(p => ({ ...p, twitterUrl: v }))} placeholder="https://twitter.com/..." />
          <Field label="LinkedIn URL" value={draft.linkedinUrl} onChange={v => setDraft(p => ({ ...p, linkedinUrl: v }))} placeholder="https://linkedin.com/..." />
          <Field label="Instagram URL" value={draft.instagramUrl} onChange={v => setDraft(p => ({ ...p, instagramUrl: v }))} placeholder="https://instagram.com/..." />
        </Section>

        {/* FAQs */}
        <Section title="FAQs">
          {draft.faqs.map((faq, i) => (
            <div key={i} style={{
              border: `1px solid ${SITE.rule}`, padding: 20, marginBottom: 16, background: SITE.limestone,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                  color: SITE.mute, letterSpacing: '0.12em', textTransform: 'uppercase',
                }}>
                  FAQ {i + 1}
                </span>
                <button
                  onClick={() => removeFaq(i)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: SITE.red, fontSize: 12, fontFamily: '"JetBrains Mono", monospace',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}
                >
                  Remover
                </button>
              </div>
              <Field
                label="Pergunta"
                value={faq.q}
                onChange={v => updateFaq(i, 'q', v)}
              />
              <Field
                label="Resposta"
                value={faq.a}
                onChange={v => updateFaq(i, 'a', v)}
                multiline
              />
            </div>
          ))}
          <button
            onClick={addFaq}
            style={{
              border: `1px dashed ${SITE.rule}`, padding: '10px 20px',
              background: 'transparent', cursor: 'pointer',
              fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
              color: SITE.mute, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}
          >
            + Adicionar FAQ
          </button>
        </Section>

        {/* Security */}
        <Section title="Segurança">
          <Field
            label="Password admin"
            value={draft.adminPassword}
            onChange={v => setDraft(p => ({ ...p, adminPassword: v }))}
            type="password"
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
        color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase',
        borderBottom: `1px solid ${SITE.rule}`, paddingBottom: 10, marginBottom: 20,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, multiline, type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
}) {
  const base: React.CSSProperties = {
    width: '100%', padding: '10px 12px', fontSize: 14,
    border: `1px solid ${SITE.rule}`,
    fontFamily: '"Space Grotesk", sans-serif', background: '#fff',
    outline: 'none', boxSizing: 'border-box', color: SITE.ink,
  };
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block', fontSize: 12, color: SITE.mute,
        marginBottom: 6, fontFamily: '"JetBrains Mono", monospace',
        letterSpacing: '0.05em',
      }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          style={{ ...base, resize: 'vertical' }}
        />
      ) : (
        <input
          type={type ?? 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={base}
        />
      )}
    </div>
  );
}
