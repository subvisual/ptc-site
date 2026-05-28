import { SITE, SITE_PALETTE, INVERSE_PALETTE_HOME, EVENTS, COMMUNITIES, communityById } from '@/lib/tokens';
import { StoneStamp, PaintedStones, makeFanPaint, makeWavePaint } from '@/lib/stones';
import { NavBar, Page } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { EventRow } from '@/components/EventRow';
import { CommunityCard } from '@/components/CommunityCard';

interface HomeProps {
  onNavigate: (page: Page, communityId?: string) => void;
  onOpenSubmit?: () => void;
  onOpenAdmin?: () => void;
}

export function Home({ onNavigate, onOpenSubmit, onOpenAdmin }: HomeProps) {
  const featured = EVENTS.slice(0, 4);
  const featuredComms = ['react-lisbon', 'python-pt', 'coimbra-ml', 'devops-porto'].map(communityById);

  return (
    <div style={{ background: SITE.paper, minHeight: '100%', fontFamily: '"Space Grotesk", sans-serif' }}>
      <NavBar active="home" onNavigate={onNavigate} onOpenSubmit={onOpenSubmit} />

      {/* Hero */}
      <div className="page-pad" style={{
        paddingTop: 80, paddingBottom: 60, position: 'relative',
        overflow: 'hidden', borderBottom: `1px solid ${SITE.rule}`,
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, opacity: 0.18, pointerEvents: 'none' }}>
          <PaintedStones
            width={420} height={420} cellSize={11}
            paint={makeFanPaint({ centerY: 0.1, slices: 11 })}
            palette={SITE_PALETTE} shape="square" jitter={0} seed={1}
          />
        </div>
        <div style={{ position: 'relative', maxWidth: 760 }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: SITE.mute,
            letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18,
          }}>
            A community of communities
          </div>
          <h1 className="hero-h1" style={{
            fontWeight: 700, letterSpacing: '-0.03em', color: SITE.ink, margin: 0,
          }}>
            Where Tech<br />Communities Gather.
          </h1>
          <div style={{
            fontSize: 18, color: SITE.inkSoft, marginTop: 22,
            lineHeight: 1.5, maxWidth: 560, textWrap: 'pretty' as React.CSSProperties['textWrap'],
          }}>
            A directory of meetups, talks, and gatherings happening across Portugal's tech communities. Curated by the organizers themselves.
          </div>
        </div>
      </div>

      {/* Main content — This week + Communities side by side */}
      <div className="home-cols" style={{ borderBottom: `1px solid ${SITE.rule}` }}>
        {/* This week — left column */}
        <div style={{ padding: '48px 48px 48px', borderRight: `1px solid ${SITE.rule}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <StoneStamp accent={SITE.green} size={10} />
              <h2 style={{ fontWeight: 700, fontSize: 24, color: SITE.ink, letterSpacing: '-0.01em', margin: 0 }}>
                This week
              </h2>
            </div>
            <div
              onClick={() => onNavigate('events')}
              style={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              All events →
            </div>
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
            color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase',
            marginBottom: 20, paddingLeft: 48,
          }}>
            12 events · 8 cities · 9 communities
          </div>
          {featured.map(e => (
            <EventRow
              key={e.id}
              event={e}
              onCommunityClick={() => onNavigate('community-detail', e.commId)}
            />
          ))}
        </div>

        {/* Communities — right column */}
        <div style={{ padding: '48px 48px 48px', background: SITE.paperWarm }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <StoneStamp accent={SITE.blue} size={10} />
              <h2 style={{ fontWeight: 700, fontSize: 24, color: SITE.ink, letterSpacing: '-0.01em', margin: 0 }}>
                Communities
              </h2>
            </div>
            <div
              onClick={() => onNavigate('communities')}
              style={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              All 12 →
            </div>
          </div>
          <div className="grid-2">
            {featuredComms.map(c => (
              <CommunityCard key={c.id} comm={c} onClick={() => onNavigate('community-detail', c.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA — submit */}
      <div style={{
        padding: '64px 48px',
        background: SITE.ink, color: SITE.limestone,
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
            background: SITE.limestone, color: SITE.ink,
            padding: '16px 24px', fontWeight: 600, fontSize: 14,
            flexShrink: 0, position: 'relative', border: 'none', cursor: 'pointer',
            fontFamily: '"Space Grotesk", sans-serif',
          }}
        >
          Submit yours →
        </button>
      </div>

      <Footer onOpenAdmin={onOpenAdmin} />
    </div>
  );
}
