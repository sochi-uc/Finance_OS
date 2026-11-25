import { useEffect, useId, useRef, useState, type PointerEvent } from 'react'

// Dependency-free SVG charts. Thin 2px lines, gradient area, a scrub crosshair (the signature
// interaction from brokerage apps), and keyboard support. All colours come from CSS tokens.

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(600)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setW(Math.max(120, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/** Monotone cubic interpolation: smooth curves without overshooting the data. */
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  const n = pts.length
  const dx: number[] = []
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1]![0] - pts[i]![0]
    m[i] = (pts[i + 1]![1] - pts[i]![1]) / (dx[i] || 1)
  }
  const t: number[] = [m[0]!]
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1]! * m[i]! <= 0 ? 0 : (m[i - 1]! + m[i]!) / 2
  t[n - 1] = m[n - 2]!
  let d = `M${pts[0]![0]},${pts[0]![1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i]!
    const [x1, y1] = pts[i + 1]!
    const h = dx[i]! / 3
    d += ` C${x0 + h},${y0 + t[i]! * h} ${x1 - h},${y1 - t[i + 1]! * h} ${x1},${y1}`
  }
  return d
}

export interface Point {
  label: string
  value: number
}

export function AreaChart({
  points,
  height = 200,
  tone = 'accent',
  onScrub,
  ariaLabel,
}: {
  points: Point[]
  height?: number
  tone?: 'accent' | 'gain' | 'loss'
  onScrub?: (index: number | null) => void
  ariaLabel: string
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const gid = useId()
  const pad = { t: 12, b: 24, x: 4 }

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || Math.abs(max) || 1
  const lo = min - span * 0.15
  const hi = max + span * 0.1
  const x = (i: number) => pad.x + (points.length === 1 ? (width - pad.x * 2) / 2 : (i / (points.length - 1)) * (width - pad.x * 2))
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (height - pad.t - pad.b)
  const xy: [number, number][] = points.map((p, i) => [x(i), y(p.value)])
  const line = points.length > 1 ? smoothPath(xy) : ''
  const area = line ? `${line} L${xy.at(-1)![0]},${height - pad.b} L${xy[0]![0]},${height - pad.b} Z` : ''

  const set = (i: number | null) => {
    setHover(i)
    onScrub?.(i)
  }
  const move = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const rel = (e.clientX - r.left - pad.x) / (r.width - pad.x * 2)
    set(Math.round(Math.min(1, Math.max(0, rel)) * (points.length - 1)))
  }
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(width / 90))))

  return (
    <div ref={ref} className={`chart chart--${tone}`}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerMove={move}
        onPointerLeave={() => set(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') set(Math.max(0, (hover ?? points.length) - 1))
          else if (e.key === 'ArrowRight') set(Math.min(points.length - 1, (hover ?? -1) + 1))
          else if (e.key === 'Escape') set(null)
        }}
        onBlur={() => set(null)}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} className="chart-grid" x1={0} x2={width} y1={pad.t + f * (height - pad.t - pad.b)} y2={pad.t + f * (height - pad.t - pad.b)} />
        ))}
        {area && <path d={area} fill={`url(#${gid})`} />}
        {line && <path d={line} className="chart-line" />}
        {points.length === 1 && <circle cx={xy[0]![0]} cy={xy[0]![1]} r={4} className="chart-dot" />}
        {points.map((p, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text key={p.label + i} x={x(i)} y={height - 6} className="chart-label" textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>
              {p.label}
            </text>
          ) : null,
        )}
        {hover != null && xy[hover] && (
          <g className="chart-cursor">
            <line x1={xy[hover][0]} x2={xy[hover][0]} y1={pad.t} y2={height - pad.b} />
            <circle cx={xy[hover][0]} cy={xy[hover][1]} r={5} />
          </g>
        )}
      </svg>
    </div>
  )
}

export function Sparkline({ series, width = 120, height = 36, tone }: { series: number[]; width?: number; height?: number; tone?: 'gain' | 'loss' }) {
  if (series.length < 2) return null
  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1
  const xy: [number, number][] = series.map((v, i) => [2 + (i / (series.length - 1)) * (width - 4), 3 + (1 - (v - min) / span) * (height - 6)])
  const t = tone ?? (series.at(-1)! >= series[0]! ? 'gain' : 'loss')
  return (
    <svg width={width} height={height} className={`spark spark--${t}`} aria-hidden="true">
      <path d={smoothPath(xy)} />
      <circle cx={xy.at(-1)![0]} cy={xy.at(-1)![1]} r={2.6} />
    </svg>
  )
}

export interface Slice {
  key: string
  label: string
  value: number
  color: string
}

/** Donut with 2px surface gaps between segments; centre shows the hovered or total value. */
export function Donut({ slices, size = 168, center }: { slices: Slice[]; size?: number; center: (hover: Slice | null) => React.ReactNode }) {
  const [hover, setHover] = useState<Slice | null>(null)
  const total = slices.reduce((s, x) => s + x.value, 0)
  const r = size / 2 - 10
  const c = 2 * Math.PI * r
  const gap = slices.filter((s) => s.value > 0).length > 1 ? 3 : 0
  let offset = 0
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Allocation">
        <circle cx={size / 2} cy={size / 2} r={r} className="donut-track" />
        {total > 0 &&
          slices
            .filter((s) => s.value > 0)
            .map((s) => {
              const len = (s.value / total) * c
              const el = (
                <circle
                  key={s.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  className={`donut-seg${hover && hover.key !== s.key ? ' is-dim' : ''}`}
                  stroke={s.color}
                  strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
                  strokeDashoffset={-offset}
                  onPointerEnter={() => setHover(s)}
                  onPointerLeave={() => setHover(null)}
                />
              )
              offset += len
              return el
            })}
      </svg>
      <div className="donut-center">{center(hover)}</div>
    </div>
  )
}

/** Support → resistance band with the current price marked. */
export function RangeBar({ support, resistance, price, pct }: { support: number; resistance: number; price: number; pct: number }) {
  if (!(resistance > support)) return null
  return (
    <div className="range" role="img" aria-label={`Price at ${pct.toFixed(0)}% of the support-to-resistance range`}>
      <div className="range-track">
        <span className="range-fill" style={{ inlineSize: `${pct}%` }} />
        <span className="range-dot" style={{ insetInlineStart: `${pct}%` }} title={String(price)} />
      </div>
    </div>
  )
}
