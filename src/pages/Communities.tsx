import { useState, useMemo } from 'react';
import { T, COMMUNITIES, ThemeKey } from '@/lib/tokens';
import { NavBar, Page } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { FilterBar } from '@/components/FilterBar';
import { CommunityCard } from '@/components/CommunityCard';
import { NewsletterCTA } from '@/components/NewsletterCTA';
import { SubmitCommunityCTA } from '@/components/SubmitCommunityCTA';

interface CommunitiesProps {
  onNavigate: (page: Page, communityId?: string) => void;
  onOpenSubmit?: () => void;
  onOpenAdmin?: () => void;
}

export function Communities({ onNavigate, onOpenSubmit, onOpenAdmin }: CommunitiesProps) {
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [activeThemes, setActiveThemes] = useState<ThemeKey[]>([]);

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
    return COMMUNITIES.filter(c => {
      const cityMatch = selectedCities.length === 0 || selectedCities.includes(c.city);
      const themeMatch = activeThemes.length === 0 || c.themes.some(t => activeThemes.includes(t));
      return cityMatch && themeMatch;
    });
  }, [selectedCities, activeThemes]);

  return (
    <div style={{ background: T.paper, minHeight: '100vh', fontFamily: '"Space Grotesk", sans-serif' }}>
      <NavBar active="communities" onNavigate={onNavigate} onOpenSubmit={onOpenSubmit} />

      {/* Page header */}
      <div style={{ padding: '40px 48px 24px' }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
          color: T.mute, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8,
        }}>
          Directory · {filtered.length} communit{filtered.length !== 1 ? 'ies' : 'y'}
        </div>
        <h1 style={{ fontWeight: 700, fontSize: 42, letterSpacing: '-0.02em', color: T.ink, margin: 0 }}>
          The communities
        </h1>
      </div>

      <FilterBar
        selectedCities={selectedCities}
        activeThemes={activeThemes}
        onCityToggle={handleCityToggle}
        onThemeToggle={handleThemeToggle}
      />

      <div style={{ padding: '32px 48px 64px' }}>
        {filtered.length === 0 ? (
          <div style={{
            marginTop: 40, textAlign: 'center',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 12,
            color: T.mute, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            No communities match your filters
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map(c => (
              <CommunityCard
                key={c.id}
                comm={c}
                onClick={() => onNavigate('community-detail', c.id)}
              />
            ))}
          </div>
        )}
      </div>

      <NewsletterCTA />

      <SubmitCommunityCTA onOpenSubmit={onOpenSubmit} />

      <Footer onOpenAdmin={onOpenAdmin} />
    </div>
  );
}
