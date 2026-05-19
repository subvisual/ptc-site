import { SITE, SITE_PALETTE } from '@/lib/tokens';
import { CleanCells } from '@/lib/stones';
import { ptcBubbleCells } from '@/lib/marks';

const MARK_CELLS = ptcBubbleCells();

export type Page = 'home' | 'events' | 'communities' | 'community-detail';

interface NavBarProps {
  active: Page;
  onNavigate: (page: Page) => void;
  onOpenAbout?: () => void;
  onOpenSubmit?: () => void;
}

const NAV_ITEMS = [
  { id: 'events' as Page,      label: 'Events',        action: 'nav' as const },
  { id: 'communities' as Page, label: 'Communities',   action: 'nav' as const },
  { id: 'submit' as const,     label: 'Submit yours',  action: 'submit' as const },
  { id: 'about' as const,      label: 'About',         action: 'about' as const },
];

export function NavBar({ active, onNavigate, onOpenAbout, onOpenSubmit }: NavBarProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 48px', borderBottom: `1px solid ${SITE.rule}`,
      background: SITE.paper,
    }}>
      <button
        onClick={() => onNavigate('home')}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        <CleanCells cells={MARK_CELLS} size={1.8} palette={SITE_PALETTE} shape="square" />
        <div style={{
          fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700,
          fontSize: 14, color: SITE.ink, lineHeight: 1, letterSpacing: '-0.01em',
        }}>
          Portuguese Tech Communities
        </div>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          const handleClick = () => {
            if (item.action === 'nav') onNavigate(item.id as Page);
            else if (item.action === 'about') onOpenAbout?.();
            else if (item.action === 'submit') onOpenSubmit?.();
          };
          return (
            <div
              key={item.id}
              onClick={handleClick}
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontSize: 14, fontWeight: isActive ? 600 : 500,
                color: isActive ? SITE.ink : SITE.mute,
                borderBottom: isActive ? `2px solid ${SITE.ink}` : '2px solid transparent',
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
