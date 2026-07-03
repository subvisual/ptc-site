import { useState, useEffect } from 'react';
import { T, communityById } from '@/lib/tokens';
import { NavBar, Page } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { CommunityBadge } from '@/components/CommunityBadge';
import { ThemeTag } from '@/components/ThemeTag';
import { EventRow, DisplayEvent } from '@/components/EventRow';
import { api, ApiEvent, ApiCommunity } from '@/lib/api';

interface CommunityDetailProps {
  communityId: string;
  onNavigate: (page: Page, communityId?: string) => void;
  onOpenSubmit?: () => void;
  onOpenAdmin?: () => void;
}

function toDisplayEvent(e: ApiEvent, communityName: string): DisplayEvent {
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    venue: e.venue,
    region: e.region,
    date: e.date,
    topics: e.topics,
    eventUrl: e.eventUrl,
    communityName,
    communitySlug: undefined,
  };
}

export function CommunityDetail({ communityId, onNavigate, onOpenSubmit, onOpenAdmin }: CommunityDetailProps) {
  const comm = communityById(communityId);
  const [upcoming, setUpcoming] = useState<DisplayEvent[]>([]);
  const [past, setPast] = useState<DisplayEvent[]>([]);
  const [showPast, setShowPast] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCommunities(),
      api.getEvents(),
      api.getEvents({ past: true }),
    ]).then(([communities, upcomingEvents, pastEvents]) => {
      const apiComm = communities.find((c: ApiCommunity) => c.slug === communityId);
      if (!apiComm) { setLoading(false); return; }

      const filterByComm = (evts: ApiEvent[]) =>
        evts.filter(e => e.communityIds.includes(apiComm.notionId));

      setUpcoming(filterByComm(upcomingEvents).map(e => toDisplayEvent(e, comm.name)));
      setPast(filterByComm(pastEvents).map(e => toDisplayEvent(e, comm.name)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [communityId]);

  return (
    <div style={{ background: T.paper, minHeight: '100vh', fontFamily: '"Space Grotesk", sans-serif', display: 'flex', flexDirection: 'column' }}>
      <NavBar active="communities" onNavigate={onNavigate} onOpenSubmit={onOpenSubmit} />

      {/* Breadcrumb */}
      <div className="page-pad" style={{
        paddingTop: 20, paddingBottom: 20, borderBottom: `1px solid ${T.rule}`,
        fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
        color: T.mute, letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        <span onClick={() => onNavigate('communities')} style={{ cursor: 'pointer' }}>
          ← Communities
        </span>
        <span> · {comm.name}</span>
      </div>

      {/* Community header */}
      <div className="comm-header-grid page-pad" style={{
        paddingTop: 48, paddingBottom: 40, borderBottom: `1px solid ${T.rule}`,
        alignItems: 'flex-start',
      }}>
        <CommunityBadge comm={comm} size={96} />
        <div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
            color: T.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6,
          }}>
            {comm.city} · since {comm.founded} · {comm.members} members
          </div>
          <h1 style={{
            fontWeight: 700, fontSize: 48, letterSpacing: '-0.025em',
            color: T.ink, margin: 0, lineHeight: 1,
          }}>
            {comm.name}
          </h1>
          <div style={{ fontSize: 16, color: T.inkSoft, marginTop: 14, lineHeight: 1.5, maxWidth: 620 }}>
            {comm.blurb}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
            {comm.themes.map(k => <ThemeTag key={k} themeKey={k} />)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          <button style={{
            background: T.ink, color: T.limestone,
            padding: '12px 18px', fontWeight: 600, fontSize: 13,
            border: 'none', cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif',
          }}>
            Visit site ↗
          </button>
          <button style={{
            border: `1px solid ${T.ink}`, padding: '12px 18px',
            fontWeight: 600, fontSize: 13, color: T.ink,
            background: 'transparent', cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif',
          }}>
            Join Discord ↗
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="stats-strip page-pad" style={{
        paddingTop: 24, paddingBottom: 24,
        borderBottom: `1px solid ${T.rule}`,
        background: T.paperWarm,
        borderTop: `1px solid ${T.rule}`,
      }}>
        {[
          { label: 'Events organized', value: comm.orgCount },
          { label: 'Years active',     value: 2026 - comm.founded },
          { label: 'Avg. attendance',  value: '85' },
          { label: 'Members',          value: comm.members },
        ].map(s => (
          <div key={s.label}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              color: T.mute, letterSpacing: '0.15em', textTransform: 'uppercase',
            }}>
              {s.label}
            </div>
            <div style={{
              fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 28,
              color: T.ink, marginTop: 4, letterSpacing: '-0.01em',
            }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Events */}
      <div className="page-pad" style={{ paddingTop: 48, paddingBottom: 64, flex: 1 }}>
        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: `1px solid ${T.rule}` }}>
          {(['upcoming', 'past'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setShowPast(tab === 'past')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '12px 20px 10px',
                color: (tab === 'past') === showPast ? T.ink : T.mute,
                borderBottom: (tab === 'past') === showPast ? `2px solid ${T.ink}` : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab === 'upcoming'
                ? `Upcoming${!loading ? ` · ${upcoming.length}` : ''}`
                : `Past events${!loading ? ` · ${past.length}` : ''}`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{
            color: T.mute, fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Loading…
          </div>
        ) : !showPast ? (
          upcoming.length > 0
            ? upcoming.map(e => <EventRow key={e.id} event={e} />)
            : (
              <div style={{
                color: T.mute, fontFamily: '"JetBrains Mono", monospace',
                fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '20px 0',
              }}>
                No upcoming events scheduled
              </div>
            )
        ) : (
          past.length > 0
            ? past.map((e, i) => (
              <div key={e.id ?? i} style={{
                display: 'grid', gridTemplateColumns: '140px 1fr',
                gap: 24, alignItems: 'center',
                padding: '14px 0', borderTop: `1px solid ${T.rule}`,
              }}>
                <div style={{
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                  color: T.mute, letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                  {e.date ? new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
                <div style={{
                  fontFamily: '"Space Grotesk", sans-serif', fontWeight: 500,
                  fontSize: 15, color: T.ink,
                }}>
                  {e.name}
                </div>
              </div>
            ))
            : (
              <div style={{
                color: T.mute, fontFamily: '"JetBrains Mono", monospace',
                fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '20px 0',
              }}>
                No past events found
              </div>
            )
        )}
      </div>

      <Footer onOpenAdmin={onOpenAdmin} />
    </div>
  );
}
