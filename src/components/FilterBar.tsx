import { SITE, THEMES, ThemeKey, CITIES, T } from '@/lib/tokens';

interface FilterBarProps {
  selectedCities?: string[];
  activeThemes?: ThemeKey[];
  view?: 'list' | 'calendar' | 'map';
  onCityToggle?: (city: string) => void;
  onThemeToggle?: (key: ThemeKey) => void;
  onViewChange?: (view: 'list' | 'calendar' | 'map') => void;
}

export function FilterBar({
  selectedCities = [],
  activeThemes = [],
  view,
  onCityToggle,
  onThemeToggle,
  onViewChange,
}: FilterBarProps) {
  const CITY_LIST = CITIES.filter(c => c !== 'All cities');
  const allCitiesSelected = selectedCities.length === 0;
  const allThemesSelected = activeThemes.length === 0;

  return (
    <div className="page-pad" style={{
      paddingTop: 20, paddingBottom: 20, borderBottom: `1px solid ${T.rule}`, background: T.paper,
    }}>
      {/* Cities */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
          color: T.mute, letterSpacing: '0.12em', textTransform: 'uppercase', minWidth: 40,
        }}>City</span>
        <span
          onClick={() => onCityToggle?.('__all__')}
          style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '4px 10px',
            color: allCitiesSelected ? T.limestone : T.ink,
            background: allCitiesSelected ? T.ink : 'transparent',
            border: `1px solid ${T.ink}`,
            cursor: 'pointer',
          }}
        >
          All
        </span>
        {CITY_LIST.map(city => {
          const on = selectedCities.includes(city);
          return (
            <span
              key={city}
              onClick={() => onCityToggle?.(city)}
              style={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '4px 10px',
                color: on ? T.limestone : T.inkSoft,
                background: on ? T.ink : 'transparent',
                border: `1px solid ${on ? T.ink : T.rule}`,
                cursor: 'pointer',
              }}
            >
              {city}
            </span>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        {/* Theme chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            color: T.mute, letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>Topics</span>
          <span
            onClick={() => onThemeToggle?.('__all__' as ThemeKey)}
            style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '4px 10px',
              color: allThemesSelected ? T.limestone : T.ink,
              background: allThemesSelected ? T.ink : 'transparent',
              border: `1px solid ${T.ink}`,
              cursor: 'pointer',
            }}
          >
            All
          </span>
          {THEMES.map(t => {
            const on = activeThemes.includes(t.key as ThemeKey);
            return (
              <span
                key={t.key}
                onClick={() => onThemeToggle?.(t.key as ThemeKey)}
                style={{
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '4px 10px',
                  color: on ? '#fff' : t.color,
                  background: on ? t.color : 'transparent',
                  border: `1px solid ${t.color}`,
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </span>
            );
          })}
        </div>

        {/* View toggle */}
        {view !== undefined && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              color: T.mute, letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>View</span>
            <div style={{ display: 'flex', border: `1px solid ${T.ink}` }}>
              {(['list', 'calendar'] as const).map((v, i) => (
                <div
                  key={v}
                  onClick={() => onViewChange?.(v)}
                  style={{
                    fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '6px 12px',
                    background: v === view ? T.ink : T.card,
                    color: v === view ? T.limestone : T.ink,
                    cursor: 'pointer',
                    borderRight: i < 2 ? `1px solid ${T.ink}` : 'none',
                  }}
                >
                  {v}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
