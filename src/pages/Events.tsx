import { useState, useMemo } from 'react';
import { SITE, EVENTS, ThemeKey, COMMUNITIES } from '@/lib/tokens';
import { NavBar, Page } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { FilterBar } from '@/components/FilterBar';
import { EventRow } from '@/components/EventRow';

interface EventsProps {
  onNavigate: (page: Page, communityId?: string) => void;
  onOpenSubmit?: () => void;
}

function groupByWeek(events: typeof EVENTS) {
  const groups: { label: string; range: string; events: typeof EVENTS }[] = [];
  const seen = new Map<string, typeof EVENTS>();

  for (const e of events) {
    const d = new Date(e.when.year, e.when.month - 1, e.when.day);
    const dow = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((dow + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const key = `${monday.getFullYear()}-${monday.getMonth()}-${monday.getDate()}`;
    const label = `Week of ${MONTHS[monday.getMonth()]} ${monday.getDate()}`;
    const range = `Mon ${String(monday.getDate()).padStart(2,'0')} — Sun ${String(sunday.getDate()).padStart(2,'0')}`;

    if (!seen.has(key)) {
      seen.set(key, []);
      groups.push({ label, range, events: seen.get(key)! });
    }
    seen.get(key)!.push(e);
  }

  return groups;
}

export function Events({ onNavigate, onOpenSubmit }: EventsProps) {
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [activeThemes, setActiveThemes] = useState<ThemeKey[]>([]);
  const [view, setView] = useState<'list' | 'calendar' | 'map'>('list');

  function handleCityToggle(city: string) {
    if (city === '__all__') {
      setSelectedCities([]);
      return;
    }
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  }

  function handleThemeToggle(key: ThemeKey) {
    setActiveThemes(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  const filtered = useMemo(() => {
    return EVENTS.filter(e => {
      const comm = COMMUNITIES.find(c => c.id === e.commId);
      const cityMatch = selectedCities.length === 0 || selectedCities.includes(e.city);
      const themeMatch =
        activeThemes.length === 0 ||
        (comm ? comm.themes.some(t => activeThemes.includes(t)) : false);
      return cityMatch && themeMatch;
    });
  }, [selectedCities, activeThemes]);

  const groups = useMemo(() => groupByWeek(filtered), [filtered]);

  return (
    <div style={{ background: SITE.paper, minHeight: '100%', fontFamily: '"Space Grotesk", sans-serif' }}>
      <NavBar
        active="events"
        onNavigate={onNavigate}
        onOpenSubmit={onOpenSubmit}
      />

      <div style={{ padding: '40px 48px 24px' }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
          color: SITE.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8,
        }}>
          Directory · {filtered.length} event{filtered.length !== 1 ? 's' : ''}
        </div>
        <h1 style={{ fontWeight: 700, fontSize: 42, letterSpacing: '-0.02em', color: SITE.ink, margin: 0 }}>
          What's happening
        </h1>
      </div>

      <FilterBar
        selectedCities={selectedCities}
        activeThemes={activeThemes}
        view={view}
        onCityToggle={handleCityToggle}
        onThemeToggle={handleThemeToggle}
        onViewChange={setView}
      />

      <div style={{ padding: '0 48px 64px' }}>
        {view !== 'list' ? (
          <div style={{
            marginTop: 80, textAlign: 'center',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 12,
            color: SITE.mute, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            {view === 'calendar' ? 'Calendar view — coming soon' : 'Map view — coming soon'}
          </div>
        ) : groups.length === 0 ? (
          <div style={{
            marginTop: 64, textAlign: 'center',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 12,
            color: SITE.mute, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            No events match your filters
          </div>
        ) : (
          groups.map(g => (
            <div key={g.label} style={{ marginTop: 40 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 4 }}>
                <h2 style={{ fontWeight: 700, fontSize: 22, color: SITE.ink, letterSpacing: '-0.01em', margin: 0 }}>
                  {g.label}
                </h2>
                <span style={{
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                  color: SITE.mute, letterSpacing: '0.12em', textTransform: 'uppercase',
                }}>
                  {g.range} · {g.events.length} event{g.events.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div>
                {g.events.map(e => (
                  <EventRow
                    key={e.id}
                    event={e}
                    onCommunityClick={() => onNavigate('community-detail', e.commId)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Footer />
    </div>
  );
}
