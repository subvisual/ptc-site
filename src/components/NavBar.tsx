import { SITE_PALETTE, T } from '@/lib/tokens';
import { CleanCells } from '@/lib/stones';
import { ptcBubbleCells } from '@/lib/marks';

const MARK_CELLS = ptcBubbleCells();

export type Page = 'home' | 'events' | 'communities' | 'community-detail' | 'about';

interface NavBarProps {
  active: Page;
  onNavigate: (page: Page) => void;
  onOpenSubmit?: () => void;
}

const NAV_ITEMS = [
  { id: 'events' as Page,      label: 'Events',        action: 'nav' as const },
  { id: 'communities' as Page, label: 'Communities',   action: 'nav' as const },
  { id: 'about' as Page,       label: 'About',         action: 'nav' as const },
  { id: 'submit' as const,     label: 'Submit yours',  action: 'submit' as const },
];

export function NavBar({ active, onNavigate, onOpenSubmit }: NavBarProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 48px', borderBottom: `1px solid ${T.rule}`,
      background: T.paper,
    }}>
      <button
        onClick={() => onNavigate('home')}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        <CleanCells cells={MARK_CELLS} size={1.4} palette={SITE_PALETTE} shape="square" />
        <div className="navbar-logo-text" style={{
          fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700,
          fontSize: 16, color: T.ink, lineHeight: 1, letterSpacing: '-0.01em',
        }}>
          Portuguese Tech Communities
        </div>
      </button>

      <div className="navbar-links">
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          const handleClick = () => {
            if (item.action === 'nav') onNavigate(item.id as Page);
            else if (item.action === 'submit') onOpenSubmit?.();
          };
          if (item.action === 'submit') {
            return (
              <div
                key={item.id}
                onClick={handleClick}
                style={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontSize: 13, fontWeight: 600,
                  background: T.ink, color: T.limestone,
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                {item.label} →
              </div>
            );
          }
          return (
            <div
              key={item.id}
              onClick={handleClick}
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontSize: 14, fontWeight: isActive ? 600 : 500,
                color: isActive ? T.ink : T.mute,
                borderBottom: isActive ? `2px solid ${T.ink}` : '2px solid transparent',
                paddingBottom: 4,
                cursor: 'pointer',
              }}
            >
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
