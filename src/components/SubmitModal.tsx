import { SITE } from '@/lib/tokens';

interface SubmitModalProps {
  formUrl: string;
  onClose: () => void;
}

export function SubmitModal({ formUrl, onClose }: SubmitModalProps) {
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
          background: SITE.paper, maxWidth: 760, width: '100%',
          height: '85vh', display: 'flex', flexDirection: 'column',
          border: `1px solid ${SITE.rule}`,
          fontFamily: '"Space Grotesk", sans-serif',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 28px', borderBottom: `1px solid ${SITE.rule}`, flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              color: SITE.green, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4,
            }}>
              Submit yours
            </div>
            <h2 style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em', color: SITE.ink, margin: 0 }}>
              Adiciona a tua comunidade
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

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {formUrl ? (
            <iframe
              src={formUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Submit form"
            />
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: 16,
              fontFamily: '"JetBrains Mono", monospace',
            }}>
              <div style={{
                fontSize: 11, color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase',
              }}>
                Form não configurado
              </div>
              <p style={{
                fontSize: 13, color: SITE.inkSoft, textAlign: 'center', maxWidth: 320, lineHeight: 1.5,
              }}>
                Adiciona o URL do form no backoffice de admin para ativar esta funcionalidade.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
