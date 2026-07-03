import { SITE, INVERSE_PALETTE_HOME, T } from '@/lib/tokens';
import { PaintedStones, makeWavePaint } from '@/lib/stones';

interface SubmitCommunityCTAProps {
  onOpenSubmit?: () => void;
}

export function SubmitCommunityCTA({ onOpenSubmit }: SubmitCommunityCTAProps) {
  return (
    <div style={{
      padding: '64px 48px',
      background: T.ink, color: T.limestone,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      gap: 32, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', right: -60, top: -40, opacity: 0.18, pointerEvents: 'none' }}>
        <PaintedStones
          width={520} height={360} cellSize={10}
          paint={makeWavePaint({ bands: 7, period: 0.55, amplitude: 0.1 })}
          palette={INVERSE_PALETTE_HOME} shape="square" jitter={0} seed={11}
        />
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: SITE.green, marginBottom: 12,
        }}>
          Run a community?
        </div>
        <h2 style={{
          fontWeight: 700, fontSize: 36, letterSpacing: '-0.02em',
          margin: 0, lineHeight: 1, maxWidth: 580,
        }}>
          Submit your community and start posting events to the directory.
        </h2>
      </div>
      <button
        onClick={onOpenSubmit}
        style={{
          background: T.limestone, color: T.ink,
          padding: '16px 24px', fontWeight: 600, fontSize: 14,
          flexShrink: 0, position: 'relative', border: 'none', cursor: 'pointer',
          fontFamily: '"Space Grotesk", sans-serif',
        }}
      >
        Submit yours →
      </button>
    </div>
  );
}
