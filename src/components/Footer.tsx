import { SITE, SITE_PALETTE, T } from '@/lib/tokens';
import { CleanCells, StoneStripe } from '@/lib/stones';
import { ptcBubbleCells } from '@/lib/marks';
import { useSiteConfig } from '@/lib/siteConfig';

const MARK_CELLS = ptcBubbleCells();

interface FooterProps {
  onOpenAdmin?: () => void;
}

export function Footer({ onOpenAdmin }: FooterProps) {
  const { config } = useSiteConfig();

  const links = [
    { label: 'linkedin', url: config.linkedinUrl },
    { label: 'twitter', url: config.twitterUrl },
    { label: 'telegram', url: config.telegramUrl },
    { label: 'whatsapp', url: config.whatsappUrl },
    { label: 'contact', url: config.contactFormUrl },
  ].filter(l => l.url);

  return (
    <div style={{ background: T.paperWarm }}>
      <div style={{ background: T.ink }}>
        <StoneStripe width={1280} rows={1} cellSize={8} color={SITE.limestone} light={SITE.ink} accentColor={SITE.green} accentEvery={11} seed={99} />
      </div>
      <div style={{ padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CleanCells cells={MARK_CELLS} size={1.4} palette={SITE_PALETTE} shape="square" />
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            color: T.mute, letterSpacing: '0.15em', textTransform: 'uppercase',
          }}>
            Portuguese Tech Communities · 2026
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            color: T.mute, letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            Powered by{' '}
            <a
              href="https://links.subvisual.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4353FF', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              Subvisual
            </a>
          </div>
        </div>
        <div style={{
          display: 'flex', gap: 24, flexWrap: 'wrap',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
          color: T.mute, letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          {links.map(l => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: T.mute, textDecoration: 'none', cursor: 'pointer' }}
            >
              {l.label}
            </a>
          ))}
          {onOpenAdmin && (
            <span onClick={onOpenAdmin} style={{ cursor: 'pointer', opacity: 0.5 }}>admin</span>
          )}
        </div>
      </div>
    </div>
  );
}
