import { Community, EVENTS, T, communityColor } from '@/lib/tokens';
import { StoneStripe } from '@/lib/stones';
import { CommunityBadge } from './CommunityBadge';
import { ThemeTag } from './ThemeTag';

interface CommunityCardProps {
  comm: Community;
  onClick?: () => void;
}

export function CommunityCard({ comm, onClick }: CommunityCardProps) {
  const upcoming = EVENTS.filter(e => e.commId === comm.id);
  return (
    <div
      onClick={onClick}
      style={{
        background: T.card,
        border: `1px solid ${T.rule}`,
        display: 'flex', flexDirection: 'column',
        minHeight: 220,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Calçada strip in community's theme color */}
      <div style={{
        display: 'flex', justifyContent: 'flex-start',
        background: communityColor(comm) + '15',
        borderBottom: `1px solid ${T.rule}`,
      }}>
        <StoneStripe width={420} rows={1} cellSize={6} color={communityColor(comm)} light={'#fff'} seed={comm.id.length * 7} />
      </div>

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <CommunityBadge comm={comm} size={40} />
          <span style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
            color: T.mute, letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            since {comm.founded}
          </span>
        </div>

        <div>
          <div style={{
            fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 20,
            color: T.ink, letterSpacing: '-0.01em', lineHeight: 1.1,
          }}>
            {comm.name}
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            color: T.mute, marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            {comm.city} · {comm.members} members
          </div>
        </div>

        <div style={{
          fontFamily: '"Space Grotesk", sans-serif', fontSize: 13,
          color: T.inkSoft, lineHeight: 1.45, flex: 1,
        }}>
          {comm.blurb}
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 14, borderTop: `1px solid ${T.rule}`,
        }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {comm.themes.map(k => <ThemeTag key={k} themeKey={k} small />)}
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            color: T.ink, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            {upcoming.length > 0
              ? `Next ${upcoming[0].when.mo} ${upcoming[0].when.day} →`
              : 'View profile →'}
          </div>
        </div>
      </div>
    </div>
  );
}
