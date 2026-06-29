import { useState, useEffect, useMemo } from 'react';
import { SITE, SITE_PALETTE, INVERSE_PALETTE_HOME, COMMUNITIES, T, communityById, ThemeKey, THEMES } from '@/lib/tokens';
import { StoneStamp, PaintedStones, makeFanPaint, makeWavePaint } from '@/lib/stones';
import { NavBar, Page } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { EventRow, DisplayEvent } from '@/components/EventRow';
import { CommunityCard } from '@/components/CommunityCard';
import { FilterBar } from '@/components/FilterBar';
import { api, ApiEvent, ApiCommunity } from '@/lib/api';
import { useSiteConfig } from '@/lib/siteConfig';

const THEMEKEY_TO_TOPICS: Record<ThemeKey, string[]> = {
  web:      ['JavaScript'],
  ai:       ['AI / ML', 'Python'],
  devops:   ['DevOps'],
  mobile:   ['Mobile'],
  design:   ['Design', 'Product Design'],
  security: ['Security'],
  oss:      ['Web3'],
  career:   [],
  hardware: ['Hardware'],
};

function toDisplayEvent(e: ApiEvent, communityMap: Map<string, ApiCommunity>): DisplayEvent {
  const comm = communityMap.get(e.communityIds[0]);
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    venue: e.venue,
    region: e.region,
    date: e.date,
    topics: e.topics,
    eventUrl: e.eventUrl,
    communityName: comm?.name ?? '',
    communitySlug: comm?.slug,
  };
}

interface HomeProps {
  onNavigate: (page: Page, communityId?: string) => void;
  onOpenSubmit?: () => void;
  onOpenAdmin?: () => void;
}

export function Home({ onNavigate, onOpenSubmit, onOpenAdmin }: HomeProps) {
  const [allEvents, setAllEvents] = useState<DisplayEvent[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [activeThemes, setActiveThemes] = useState<ThemeKey[]>([]);
  const DEFAULT_COMM_IDS = ['react-lisbon', 'python-pt', 'coimbra-ml', 'devops-porto'];

  const featuredComms = useMemo(() => {
    const hasFilters = selectedCities.length > 0 || activeThemes.length > 0;
    if (!hasFilters) return DEFAULT_COMM_IDS.map(communityById);
    return COMMUNITIES.filter(c => {
      const cityMatch = selectedCities.length === 0 || selectedCities.includes(c.city);
      const themeMatch = activeThemes.length === 0 || activeThemes.some(tk => c.themes.includes(tk));
      return cityMatch && themeMatch;
    }).slice(0, 4);
  }, [selectedCities, activeThemes]);
  const { config } = useSiteConfig();

  useEffect(() => {
    Promise.all([api.getEvents(), api.getCommunities()])
      .then(([evts, comms]) => {
        const communityMap = new Map(comms.map(c => [c.notionId, c]));
        setAllEvents(evts.slice(0, 20).map(e => toDisplayEvent(e, communityMap)));
      })
      .catch(() => {});
  }, []);

  const featured = useMemo(() => {
    return allEvents.filter(e => {
      const cityMatch = selectedCities.length === 0 || selectedCities.includes(e.region);
      const themeMatch =
        activeThemes.length === 0 ||
        activeThemes.some(tk =>
          (THEMEKEY_TO_TOPICS[tk] ?? []).some(t => e.topics.includes(t))
        );
      return cityMatch && themeMatch;
    }).slice(0, 8);
  }, [allEvents, selectedCities, activeThemes]);

  function handleCityToggle(city: string) {
    if (city === '__all__') { setSelectedCities([]); return; }
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  }

  function handleThemeToggle(key: ThemeKey) {
    setActiveThemes(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  return (
    <div style={{ background: T.paper, minHeight: '100vh', fontFamily: '"Space Grotesk", sans-serif' }}>
      <NavBar active="home" onNavigate={onNavigate} onOpenSubmit={onOpenSubmit} />

      {/* Hero */}
      <div className="page-pad" style={{
        paddingTop: 80, paddingBottom: 60, position: 'relative',
        overflow: 'hidden', borderBottom: `1px solid ${T.rule}`,
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
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: T.mute,
            letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18,
          }}>
            A community of communities
          </div>
          <h1 className="hero-h1" style={{
            fontWeight: 700, letterSpacing: '-0.03em', color: T.ink, margin: 0,
          }}>
            Where Tech<br />Communities Gather.
          </h1>
          <div style={{
            fontSize: 18, color: T.inkSoft, marginTop: 22,
            lineHeight: 1.5, maxWidth: 560, textWrap: 'pretty' as React.CSSProperties['textWrap'],
          }}>
            A curated directory of in-person meetups, talks and gatherings happening in Portugal's tech communities.
          </div>
        </div>
      </div>

      <FilterBar
        selectedCities={selectedCities}
        activeThemes={activeThemes}
        onCityToggle={handleCityToggle}
        onThemeToggle={handleThemeToggle}
      />

      {/* Main content — This week + Communities side by side */}
      <div className="home-cols" style={{ borderBottom: `1px solid ${T.rule}` }}>
        {/* This week — left column */}
        <div style={{ padding: '48px 48px 48px', borderRight: `1px solid ${T.rule}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <StoneStamp accent={SITE.green} size={10} />
              <h2 style={{ fontWeight: 700, fontSize: 24, color: T.ink, letterSpacing: '-0.01em', margin: 0 }}>
                This week
              </h2>
            </div>
            <div
              onClick={() => onNavigate('events')}
              style={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                color: T.mute, letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              All events →
            </div>
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
            color: T.mute, letterSpacing: '0.15em', textTransform: 'uppercase',
            marginBottom: 20, paddingLeft: 48,
          }}>
            {featured.length} event{featured.length !== 1 ? 's' : ''}
            {selectedCities.length > 0 ? ` · ${selectedCities.join(', ')}` : ''}
            {activeThemes.length > 0 ? ` · ${activeThemes.map(k => THEMES.find(t => t.key === k)?.label).join(', ')}` : ''}
          </div>
          {featured.map(e => (
            <EventRow
              key={e.id}
              event={e}
              onCommunityClick={e.communitySlug
                ? () => onNavigate('community-detail', e.communitySlug)
                : undefined}
            />
          ))}
        </div>

        {/* Communities — right column */}
        <div style={{ padding: '48px 48px 48px', background: T.paperWarm }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <StoneStamp accent={SITE.blue} size={10} />
              <h2 style={{ fontWeight: 700, fontSize: 24, color: T.ink, letterSpacing: '-0.01em', margin: 0 }}>
                Communities
              </h2>
            </div>
            <div
              onClick={() => onNavigate('communities')}
              style={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                color: T.mute, letterSpacing: '0.15em', textTransform: 'uppercase',
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

      {/* CTA — newsletter / community channels */}
      {(config.newsletterUrl || config.whatsappUrl || config.telegramUrl) && (
        <div style={{
          padding: '56px 48px',
          borderBottom: `1px solid ${T.rule}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 32, textAlign: 'center',
        }}>
          <div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: T.mute, marginBottom: 12,
            }}>
              Fica a par
            </div>
            <h2 style={{
              fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em',
              color: T.ink, margin: 0,
            }}>
              Não percas nenhum evento
            </h2>
            <p style={{ fontSize: 16, color: T.inkSoft, marginTop: 10, marginBottom: 0 }}>
              Subscreve a newsletter ou junta-te à conversa no WhatsApp ou Telegram.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {config.newsletterUrl && (
              <a href={config.newsletterUrl} target="_blank" rel="noopener noreferrer" style={{
                background: T.ink, color: T.limestone,
                padding: '13px 22px', fontWeight: 600, fontSize: 14,
                fontFamily: '"Space Grotesk", sans-serif',
                textDecoration: 'none', display: 'inline-block',
              }}>
                Newsletter →
              </a>
            )}
            {config.whatsappUrl && (
              <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" style={{
                background: '#25D366', color: '#fff',
                padding: '13px 22px', fontWeight: 600, fontSize: 14,
                fontFamily: '"Space Grotesk", sans-serif',
                textDecoration: 'none', display: 'inline-block',
              }}>
                WhatsApp →
              </a>
            )}
            {config.telegramUrl && (
              <a href={config.telegramUrl} target="_blank" rel="noopener noreferrer" style={{
                background: '#229ED9', color: '#fff',
                padding: '13px 22px', fontWeight: 600, fontSize: 14,
                fontFamily: '"Space Grotesk", sans-serif',
                textDecoration: 'none', display: 'inline-block',
              }}>
                Telegram →
              </a>
            )}
          </div>
        </div>
      )}

      {/* CTA — submit */}
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

      <Footer onOpenAdmin={onOpenAdmin} />
    </div>
  );
}
