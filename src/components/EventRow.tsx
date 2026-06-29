import { SITE, T } from '@/lib/tokens';

export interface DisplayEvent {
  id: string;
  name: string;
  description: string;
  venue: string;
  region: string;
  date: string | null;
  topics: string[];
  eventUrl: string;
  communityName: string;
  communitySlug?: string;
}

interface EventRowProps {
  event: DisplayEvent;
  onCommunityClick?: () => void;
}

const TOPIC_COLORS: Record<string, string> = {
  'JavaScript':     SITE.blue,
  'AI / ML':        SITE.purple,
  'Python':         SITE.ochre,
  'Rust':           SITE.red,
  'Elixir':         SITE.purple,
  'DevOps':         SITE.teal,
  'Web3':           SITE.green,
  'Mobile':         SITE.ochre,
  'Hardware':       SITE.red,
  'Product Design': SITE.red,
  'Design':         SITE.red,
  'Security':       SITE.mute,
  'Fintech':        SITE.mute,
  'Blockchain':     SITE.purple,
};

function topicColor(topic: string): string {
  return TOPIC_COLORS[topic] ?? SITE.mute;
}

function parseDate(iso: string | null) {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, yr, mo, dy, hr = '0', mn = '0'] = m;
  const d = new Date(+yr, +mo - 1, +dy, +hr, +mn);
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const WEEKDAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  return {
    day: d.getDate(),
    mo: MONTHS[d.getMonth()],
    wd: WEEKDAYS[d.getDay()],
    time: `${String(+hr).padStart(2,'0')}:${String(+mn).padStart(2,'0')}`,
  };
}

export function EventRow({ event, onCommunityClick }: EventRowProps) {
  const parsed = parseDate(event.date);
  const badgeColor = event.topics.length > 0 ? topicColor(event.topics[0]) : SITE.mute;
  const initials = event.communityName.split(/\s+/).slice(0, 2).map(w => w[0]).join('');

  return (
    <div className="event-row-grid" style={{
      alignItems: 'start',
      padding: '20px 0',
      borderTop: `1px solid ${T.rule}`,
    }}>
      {/* Date block */}
      <div style={{ borderRight: `1px solid ${T.rule}`, paddingRight: 16, textAlign: 'right' }}>
        {parsed ? (
          <>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              letterSpacing: '0.15em', color: T.mute, textTransform: 'uppercase',
            }}>
              {parsed.wd}
            </div>
            <div style={{
              fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 28,
              lineHeight: 1, color: T.ink, marginTop: 4,
            }}>
              {String(parsed.day).padStart(2, '0')}
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              color: T.mute, marginTop: 4, letterSpacing: '0.1em',
            }}>
              {parsed.mo}
            </div>
          </>
        ) : (
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            color: T.mute, letterSpacing: '0.1em',
          }}>TBD</div>
        )}
      </div>

      {/* Content */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            onClick={onCommunityClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: onCommunityClick ? 'pointer' : 'default',
            }}
          >
            <div style={{
              width: 20, height: 20,
              background: badgeColor, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"JetBrains Mono", monospace', fontWeight: 500,
              fontSize: 8, borderRadius: 4, flexShrink: 0,
            }}>
              {initials}
            </div>
            <span style={{
              fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600,
              fontSize: 13, color: T.ink,
              textDecoration: onCommunityClick ? 'underline' : 'none',
              textDecorationColor: T.rule,
              textUnderlineOffset: 3,
            }}>
              {event.communityName}
            </span>
          </div>
          <span style={{ color: T.rule }}>·</span>
          <span style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
            color: T.mute, letterSpacing: '0.05em',
          }}>
            {parsed?.time} · {event.region} · {event.venue}
          </span>
        </div>
        <div style={{
          fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 20,
          color: T.ink, letterSpacing: '-0.01em', lineHeight: 1.2,
        }}>
          {event.name}
        </div>
        <div style={{
          fontFamily: '"Space Grotesk", sans-serif', fontSize: 13,
          color: T.inkSoft, lineHeight: 1.45, marginTop: 6,
        }}>
          {event.description}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {event.topics.slice(0, 2).map(t => (
            <span key={t} style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: topicColor(t),
              border: `1px solid ${topicColor(t)}55`,
              background: `${topicColor(t)}10`,
              padding: '2px 6px', borderRadius: 2,
            }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Action */}
      <div>
        <a href={event.eventUrl || '#'} target="_blank" rel="noopener noreferrer" style={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 600, fontSize: 13,
          background: T.ink, color: T.limestone,
          padding: '10px 16px',
          display: 'inline-block',
          textDecoration: 'none',
        }}>
          Register ↗
        </a>
      </div>
    </div>
  );
}
