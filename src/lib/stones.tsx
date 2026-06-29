import React from 'react';

// Seeded RNG — deterministic jitter
export function mulberry32(seed: number) {
  return function() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Palette {
  dark: string;
  light: string;
  accent: string;
}

// ─── CleanCells — render a cells grid as clean SVG rectangles ───────────────
interface CleanCellsProps {
  cells: string[];
  size?: number;
  palette: Palette;
  shape?: 'square' | 'soft' | 'round';
  padding?: number;
  style?: React.CSSProperties;
}

export function CleanCells({ cells, size = 24, palette, shape = 'square', padding = 0, style }: CleanCellsProps) {
  const rows = cells.length;
  const cols = Math.max(...cells.map(r => r.length));
  const W = cols * size + padding * 2;
  const H = rows * size + padding * 2;
  const radius = shape === 'soft' ? size * 0.18 : 0;
  const items: React.ReactNode[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      const ch = cells[r][c];
      let fill: string | null = null;
      if (ch === '1') fill = palette.dark;
      else if (ch === '0') fill = palette.light;
      else if (ch === '2') fill = palette.accent;
      if (!fill) continue;
      const x = padding + c * size;
      const y = padding + r * size;
      if (shape === 'round') {
        items.push(<circle key={`${r}-${c}`} cx={x + size / 2} cy={y + size / 2} r={size / 2} fill={fill} />);
      } else {
        items.push(
          <rect key={`${r}-${c}`} x={x} y={y} width={size} height={size}
            rx={radius || undefined} ry={radius || undefined} fill={fill} />
        );
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block', ...style }}>
      {items}
    </svg>
  );
}

// ─── Stone — one jittered stone ──────────────────────────────────────────────
type StoneRole = 'dark' | 'light' | 'accent' | 'empty';

interface StoneProps {
  x: number; y: number; size: number; role: StoneRole;
  seed?: number; shape?: string; jitter?: number; palette: Palette;
}

function Stone({ x, y, size, role, seed = 0, shape = 'square', jitter = 0.18, palette }: StoneProps) {
  if (role === 'empty') return null;
  const rng = mulberry32(seed * 9301 + x * 131 + y * 7);
  const rot = (rng() - 0.5) * 8 * jitter; // ~±0.7° at default jitter=0.18
  const dx = (rng() - 0.5) * size * jitter;
  const dy = (rng() - 0.5) * size * jitter;
  const s = size * (1 - jitter * 0.25) + rng() * size * jitter * 0.5;
  let fill = palette.light;
  if (role === 'dark') fill = palette.dark;
  if (role === 'accent') fill = palette.accent;
  const cx = x + size / 2 + dx;
  const cy = y + size / 2 + dy;

  if (shape === 'round') {
    return <circle cx={cx} cy={cy} r={s / 2} fill={fill} />;
  }
  const half = s / 2;
  const r = shape === 'soft' ? s * 0.22 : s * 0.06;
  return (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
      <rect x={cx - half} y={cy - half} width={s} height={s} rx={r} ry={r} fill={fill} />
    </g>
  );
}

// ─── PaintedStones — continuous paint function drives stone grid ──────────────
export type PaintFn = (x: number, y: number, W: number, H: number) => StoneRole | 'empty';

interface PaintedStonesProps {
  width: number; height: number; cellSize?: number;
  paint: PaintFn; palette: Palette;
  shape?: string; jitter?: number; seed?: number;
}

export function PaintedStones({ width, height, cellSize = 12, paint, palette, shape = 'soft', jitter = 0.18, seed = 1 }: PaintedStonesProps) {
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const items: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize;
      const y = r * cellSize;
      const role = paint(x + cellSize / 2, y + cellSize / 2, width, height) as StoneRole;
      if (!role || role === 'empty') continue;
      items.push(
        <Stone key={`${r}-${c}`} x={x} y={y} size={cellSize} role={role}
          seed={seed + r * 31 + c} shape={shape} jitter={jitter} palette={palette} />
      );
    }
  }
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} style={{ overflow: 'visible' }}>
      {items}
    </svg>
  );
}

// ─── Paint functions ──────────────────────────────────────────────────────────
// ─── Hash helper for tech patterns ───────────────────────────────────────────
function _h2(a: number, b: number): number {
  let t = ((Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663)) >>> 0);
  t = (Math.imul(t ^ (t >>> 13), 0x85ebca6b)) >>> 0;
  t ^= t >>> 16;
  return (t >>> 0) / 4294967296;
}

export function makeWavePaint({ bands = 6, period = 0.7, amplitude = 0.12 } = {}): PaintFn {
  return (x, y, W, H) => {
    const offset = Math.sin((x / W) * Math.PI * 2 * period * 2) * H * amplitude;
    const band = ((y + offset) / H) * bands;
    return Math.floor(band) % 2 === 0 ? 'dark' : 'light';
  };
}

export function makeFanPaint({ centerY = 1.0, slices = 14 } = {}): PaintFn {
  return (x, y, W, H) => {
    const cx = W / 2;
    const cy = H * centerY;
    const dx = x - cx, dy = y - cy;
    if (dy > 0) return 'light';
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxR = Math.min(W, H * Math.abs(centerY));
    if (dist > maxR * 0.95) return 'light';
    if (dist < 8) return 'dark';
    const angle = Math.atan2(-dy, dx);
    const slice = (angle / Math.PI) * slices;
    return Math.floor(slice) % 2 === 0 ? 'dark' : 'light';
  };
}

export function makeSignalPaint({ cycles = 2.3, amp = 0.22, thickness = 0.03, baseline = 0.5 } = {}): PaintFn {
  return (x, y, W, H) => {
    const ph = (x / W) * Math.PI * 2 * cycles;
    const yc = baseline * H + Math.sin(ph) * H * amp + Math.sin(ph * 2.4 + 1.1) * H * amp * 0.3;
    return Math.abs(y - yc) < H * thickness ? 'dark' : 'light';
  };
}

export function makeBitstreamPaint({ rows = 9, fill = 0.32, activeRows = 0.7, band = 0.5, seed = 1 } = {}): PaintFn {
  return (x, y, W, H) => {
    const rowH = H / rows, ri = Math.floor(y / rowH);
    const within = (y - ri * rowH) / rowH;
    if (Math.abs(within - 0.5) > band / 2) return 'light';
    if (_h2(ri + 101, seed * 7) > activeRows) return 'light';
    const ci = Math.floor(x / rowH);
    return _h2(ci * 3 + 17, ri * 13 + seed) < fill ? 'dark' : 'light';
  };
}

export function makeCircuitPaint({ grid = 7, traceProb = 0.5, thickness = 5, padProb = 0.16, pad = 9, seed = 1 } = {}): PaintFn {
  return (x, y, W, H) => {
    const gx = W / grid, gy = H / grid;
    const hi = Math.round(y / gy), vi = Math.round(x / gx);
    const onH = hi > 0 && hi < grid && Math.abs(y - hi * gy) < thickness && _h2(hi + 1, seed) < traceProb;
    const onV = vi > 0 && vi < grid && Math.abs(x - vi * gx) < thickness && _h2(vi + 50, seed + 9) < traceProb;
    if (onH || onV) return 'dark';
    const ni = Math.round(x / gx), nj = Math.round(y / gy);
    if (ni > 0 && ni < grid && nj > 0 && nj < grid && _h2(ni + nj * 31, seed + 7) < padProb) {
      const dx = x - ni * gx, dy = y - nj * gy;
      if (dx * dx + dy * dy < pad * pad) return 'dark';
    }
    return 'light';
  };
}

export function makeDataRainPaint({ angleDeg = 16, colW = 24, dash = 26, gap = 50, active = 0.6, seed = 1 } = {}): PaintFn {
  const a = (angleDeg * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  return (x, y, _W, _H) => {
    const u = x * sa + y * ca, v = x * ca - y * sa;
    const ci = Math.floor(v / colW);
    if (_h2(ci + 3, seed) > active) return 'light';
    const period = dash + gap, phase = _h2(ci + 90, seed + 4) * period;
    const t = (((u + phase) % period) + period) % period;
    return t < dash ? 'dark' : 'light';
  };
}

const INVADERS_SPRITES = [
  ['00100000100','00010001000','00111111100','01101110110','11111111111','10111111101','10100000101','00011011000'],
  ['00000100000','00001110000','00011111000','00111111100','01111111110','01100100110','00011011000','00100000100'],
  ['01000000010','00100000100','00111111100','01110001110','01111111110','00111111100','00100100100','01000000010'],
];

export function makeInvadersPaint({ pix = 13, gapX = 3, gapY = 3, seed = 1 } = {}): PaintFn {
  const sw = 11, sh = 8, blockW = (sw + gapX) * pix, blockH = (sh + gapY) * pix;
  return (x, y, _W, _H) => {
    const bx = Math.floor(x / blockW), by = Math.floor(y / blockH);
    const lx = Math.floor((x - bx * blockW) / pix), ly = Math.floor((y - by * blockH) / pix);
    if (lx >= sw || ly >= sh) return 'light';
    const idx = Math.floor(_h2(bx + 7, by * 13 + seed) * INVADERS_SPRITES.length) % INVADERS_SPRITES.length;
    return INVADERS_SPRITES[idx][ly]?.[lx] === '1' ? 'dark' : 'light';
  };
}

// ─── StoneStripe — horizontal 1–2 row stone strip ────────────────────────────
interface StoneStripeProps {
  width?: number; rows?: number; cellSize?: number;
  color?: string; light?: string; accentColor?: string;
  accentEvery?: number; seed?: number;
}

export function StoneStripe({
  width = 1200, rows = 1, cellSize = 8,
  color = '#1a1a1a', light = '#ece9df',
  accentColor, accentEvery = 0, seed = 1,
}: StoneStripeProps) {
  const cols = Math.floor(width / cellSize);
  const cells: string[] = [];
  for (let r = 0; r < rows; r++) {
    let row = '';
    for (let c = 0; c < cols; c++) {
      const v = (c + r * 2) % 3;
      let ch = v === 0 ? '1' : '0';
      if (accentEvery > 0 && c > 0 && c % accentEvery === 0 && r === 0) ch = '2';
      row += ch;
    }
    cells.push(row);
  }
  const palette: Palette = { dark: color, light, accent: accentColor || color };
  return <CleanCells cells={cells} size={cellSize} palette={palette} shape="square" />;
}

// ─── StoneStamp — 3 stones accent ────────────────────────────────────────────
interface StoneStampProps {
  accent?: string;
  size?: number;
}

export function StoneStamp({ accent = '#1F8A5B', size = 10 }: StoneStampProps) {
  const palette: Palette = { dark: '#1a1a1a', light: '#efebe0', accent };
  return <CleanCells cells={['121']} size={size} palette={palette} shape="square" />;
}
