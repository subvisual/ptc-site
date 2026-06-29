import { useState, useEffect, useMemo } from 'react';
import { T, ThemeKey } from '@/lib/tokens';
import { NavBar, Page } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { FilterBar } from '@/components/FilterBar';
import { EventRow, DisplayEvent } from '@/components/EventRow';
import { api, ApiEvent, ApiCommunity } from '@/lib/api';

interface EventsProps {
  onNavigate: (page: Page, communityId?: string) => void;
  onOpenSubmit?: () => void;
}

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

// City positions as % of mainland viewBox 400x650
// lon -9.5→-6.2 (400px wide), lat 37.0→42.2 (650px tall)
const CITY_POSITIONS: Record<string, { x: number; y: number }> = {
  'Braga':   { x: 32.5, y: 12.5 },
  'Porto':   { x: 24,   y: 19.5 },
  'Aveiro':  { x: 26,   y: 30   },
  'Coimbra': { x: 32.5, y: 38.3 },
  'Lisboa':  { x: 11,   y: 67   },
  'Setúbal': { x: 18.5, y: 70.8 },
  'Évora':   { x: 48,   y: 69.7 },
  'Faro':    { x: 47.5, y: 92   },
  'Funchal': { x: 47.5, y: 92   }, // shown in Madeira inset
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

function groupByWeek(events: DisplayEvent[]) {
  const groups: { label: string; range: string; events: DisplayEvent[] }[] = [];
  const seen = new Map<string, DisplayEvent[]>();

  for (const e of events) {
    if (!e.date) continue;
    const m = e.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) continue;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
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

function CalendarView({ events }: { events: DisplayEvent[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DisplayEvent[]>();
    for (const e of events) {
      if (!e.date) continue;
      const m = e.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!m) continue;
      const key = `${m[1]}-${m[2]}-${m[3]}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
  const totalDays = lastDay.getDate();

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedKey = selectedDay !== null
    ? `${year}-${String(month + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
    : null;
  const selectedEvents = selectedKey ? (eventsByDay.get(selectedKey) ?? []) : [];

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  return (
    <div style={{ marginTop: 32 }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: `1px solid ${T.rule}`, cursor: 'pointer', padding: '6px 14px', color: T.ink, fontFamily: '"Space Grotesk", sans-serif', fontSize: 14 }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em', color: T.ink, minWidth: 180, textAlign: 'center' }}>
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} style={{ background: 'none', border: `1px solid ${T.rule}`, cursor: 'pointer', padding: '6px 14px', color: T.ink, fontFamily: '"Space Grotesk", sans-serif', fontSize: 14 }}>→</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: T.rule }}>
        {DAYS.map(d => (
          <div key={d} style={{
            background: T.paperWarm, padding: '8px 0', textAlign: 'center',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            letterSpacing: '0.12em', textTransform: 'uppercase', color: T.mute,
          }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: T.rule }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={i} style={{ background: T.paperWarm, minHeight: 80 }} />;
          const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSelected = day === selectedDay;
          return (
            <div
              key={i}
              onClick={() => dayEvents.length > 0 && setSelectedDay(isSelected ? null : day)}
              style={{
                background: isSelected ? T.ink : T.paper,
                minHeight: 80, padding: '8px 10px',
                cursor: dayEvents.length > 0 ? 'pointer' : 'default',
              }}
            >
              <div style={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                color: isSelected ? T.limestone : isToday ? T.ink : T.mute,
                fontWeight: isToday ? 700 : 400,
                marginBottom: 6,
              }}>
                {isToday ? `[${day}]` : day}
              </div>
              {dayEvents.map((e, j) => (
                <div key={j} style={{
                  background: isSelected ? T.limestone : T.ink,
                  color: isSelected ? T.ink : T.limestone,
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
                  letterSpacing: '0.05em', padding: '2px 5px',
                  marginBottom: 2, overflow: 'hidden',
                  whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}>
                  {e.name}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Selected day events */}
      {selectedDay !== null && selectedEvents.length > 0 && (
        <div style={{ marginTop: 32, borderTop: `1px solid ${T.rule}`, paddingTop: 24 }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
            color: T.mute, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            {MONTHS[month]} {selectedDay} · {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
          </div>
          {selectedEvents.map(e => <EventRow key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
}

function MapView({ events }: { events: DisplayEvent[] }) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const byCity = useMemo(() => {
    const map = new Map<string, DisplayEvent[]>();
    for (const e of events) {
      const city = e.region || 'Other';
      if (!map.has(city)) map.set(city, []);
      map.get(city)!.push(e);
    }
    return map;
  }, [events]);

  const cities = Array.from(byCity.keys());
  const selectedEvents = selectedCity ? (byCity.get(selectedCity) ?? []) : [];

  return (
    <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '300px 1fr', gap: 40, alignItems: 'start' }}>
      {/* Portugal map */}
      <div style={{ position: 'relative', background: T.paperWarm, border: `1px solid ${T.rule}` }}>
        <svg viewBox="0 0 400 670" style={{ display: 'block', width: '100%' }}>
          {/* Portugal mainland — real geographic projection */}
          <path
            d="M 80,41 L 126,16 L 200,30 L 246,57 L 290,44 L 333,48
               L 391,90
               L 362,120 L 324,139 L 321,198
               L 294,231 L 243,297
               L 251,365 L 284,415
               L 260,460 L 248,510
               L 223,570 L 249,622
               L 220,648 L 160,648 L 61,648
               L 88,596 L 76,530
               L 74,460 L 52,448 L 10,437
               L 14,355
               L 60,290 L 77,256
               L 103,195 L 97,127
               L 80,62 Z"
            fill={T.paper} stroke={T.rule} strokeWidth="1.5"
          />
          {/* Madeira inset */}
          <rect x="8" y="490" width="85" height="52" fill={T.paperWarm} stroke={T.rule} strokeWidth="1" rx="2"/>
          <text x="12" y="503" fontFamily='"JetBrains Mono", monospace' fontSize="7" fill={T.mute} letterSpacing="0.08em" textTransform="uppercase">MADEIRA</text>
          <ellipse cx="52" cy="523" rx="24" ry="9" fill={T.paper} stroke={T.rule} strokeWidth="1"/>
          <ellipse cx="18" cy="530" rx="5" ry="3" fill={T.paper} stroke={T.rule} strokeWidth="1"/>
          {/* Açores inset */}
          <rect x="8" y="552" width="85" height="68" fill={T.paperWarm} stroke={T.rule} strokeWidth="1" rx="2"/>
          <text x="12" y="565" fontFamily='"JetBrains Mono", monospace' fontSize="7" fill={T.mute} letterSpacing="0.08em">AÇORES</text>
          <ellipse cx="25" cy="580" rx="6" ry="3" fill={T.paper} stroke={T.rule} strokeWidth="1"/>
          <ellipse cx="38" cy="585" rx="4" ry="2.5" fill={T.paper} stroke={T.rule} strokeWidth="1"/>
          <ellipse cx="50" cy="578" rx="5" ry="3" fill={T.paper} stroke={T.rule} strokeWidth="1"/>
          <ellipse cx="62" cy="590" rx="8" ry="3.5" fill={T.paper} stroke={T.rule} strokeWidth="1"/>
          <ellipse cx="78" cy="596" rx="4" ry="2.5" fill={T.paper} stroke={T.rule} strokeWidth="1"/>
          <ellipse cx="30" cy="600" rx="4" ry="2" fill={T.paper} stroke={T.rule} strokeWidth="1"/>
          <ellipse cx="18" cy="608" rx="7" ry="3" fill={T.paper} stroke={T.rule} strokeWidth="1"/>
          {/* City markers */}
          {Object.entries(CITY_POSITIONS).map(([city, pos]) => {
            if (city === 'Funchal') return null;
            const count = byCity.get(city)?.length ?? 0;
            const cx = pos.x / 100 * 400;
            const cy = pos.y / 100 * 650;
            const isActive = count > 0;
            const isSelected = city === selectedCity;
            return (
              <g key={city} onClick={() => isActive && setSelectedCity(isSelected ? null : city)} style={{ cursor: isActive ? 'pointer' : 'default' }}>
                <circle
                  cx={cx} cy={cy} r={isSelected ? 10 : isActive ? 8 : 5}
                  fill={isSelected ? T.ink : isActive ? T.ink : T.rule}
                  opacity={isActive ? 1 : 0.4}
                />
                {isActive && (
                  <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
                    fill={T.limestone} fontSize="8" fontFamily='"JetBrains Mono", monospace' fontWeight="700">
                    {count}
                  </text>
                )}
                <text x={cx + 14} y={cy + 1} dominantBaseline="middle"
                  fill={isActive ? T.ink : T.mute} fontSize="9"
                  fontFamily='"JetBrains Mono", monospace'
                  style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {city}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* City event list */}
      <div>
        {selectedCity ? (
          <>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
              color: T.mute, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16,
            }}>
              {selectedCity} · {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
              <span
                onClick={() => setSelectedCity(null)}
                style={{ marginLeft: 16, cursor: 'pointer', color: T.ink }}
              >× clear</span>
            </div>
            {selectedEvents.map(e => <EventRow key={e.id} event={e} />)}
          </>
        ) : (
          <div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
              color: T.mute, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 24,
            }}>
              {events.length} events · {cities.length} cities
            </div>
            {cities.map(city => {
              const cityEvts = byCity.get(city)!;
              return (
                <div
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 0', borderTop: `1px solid ${T.rule}`,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 15, color: T.ink }}>{city}</span>
                  <span style={{
                    fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                    color: T.mute, letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    {cityEvts.length} event{cityEvts.length !== 1 ? 's' : ''} →
                  </span>
                </div>
              );
            })}
            {cities.length === 0 && (
              <div style={{
                color: T.mute, fontFamily: '"JetBrains Mono", monospace',
                fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                No events match your filters
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Events({ onNavigate, onOpenSubmit }: EventsProps) {
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [activeThemes, setActiveThemes] = useState<ThemeKey[]>([]);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getEvents({ past: showPast }), api.getCommunities()])
      .then(([evts, comms]) => {
        const communityMap = new Map(comms.map(c => [c.notionId, c]));
        setEvents(evts.map(e => toDisplayEvent(e, communityMap)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [showPast]);

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

  const filtered = useMemo(() => {
    return events.filter(e => {
      const cityMatch = selectedCities.length === 0 || selectedCities.includes(e.region);
      const themeMatch =
        activeThemes.length === 0 ||
        activeThemes.some(tk =>
          (THEMEKEY_TO_TOPICS[tk] ?? []).some(t => e.topics.includes(t))
        );
      return cityMatch && themeMatch;
    });
  }, [events, selectedCities, activeThemes]);

  const groups = useMemo(() => groupByWeek(filtered), [filtered]);

  return (
    <div style={{ background: T.paper, minHeight: '100vh', fontFamily: '"Space Grotesk", sans-serif', display: 'flex', flexDirection: 'column' }}>
      <NavBar
        active="events"
        onNavigate={onNavigate}
        onOpenSubmit={onOpenSubmit}
      />

      <div style={{ padding: '40px 48px 24px' }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
          color: T.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8,
        }}>
          Directory · {filtered.length} event{filtered.length !== 1 ? 's' : ''}
        </div>
        <h1 style={{ fontWeight: 700, fontSize: 42, letterSpacing: '-0.02em', color: T.ink, margin: 0 }}>
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

      {view === 'list' && (
        <div style={{ padding: '0 48px', borderBottom: `1px solid ${T.rule}`, display: 'flex' }}>
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
              {tab === 'upcoming' ? 'Upcoming' : 'Past events'}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '0 48px 64px', flex: 1 }}>
        {loading ? (
          <div style={{
            marginTop: 80, textAlign: 'center',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 12,
            color: T.mute, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Loading events…
          </div>
        ) : view === 'calendar' ? (
          <CalendarView events={filtered} />
        ) : groups.length === 0 ? (
          <div style={{
            marginTop: 64, textAlign: 'center',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 12,
            color: T.mute, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            No events match your filters
          </div>
        ) : (
          groups.map(g => (
            <div key={g.label} style={{ marginTop: 40 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 4 }}>
                <h2 style={{ fontWeight: 700, fontSize: 22, color: T.ink, letterSpacing: '-0.01em', margin: 0 }}>
                  {g.label}
                </h2>
                <span style={{
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                  color: T.mute, letterSpacing: '0.12em', textTransform: 'uppercase',
                }}>
                  {g.range} · {g.events.length} event{g.events.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div>
                {g.events.map(e => (
                  <EventRow
                    key={e.id}
                    event={e}
                    onCommunityClick={e.communitySlug
                      ? () => onNavigate('community-detail', e.communitySlug)
                      : undefined}
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
