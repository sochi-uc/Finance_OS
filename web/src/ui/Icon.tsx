import type { ReactNode } from 'react'

// Line icons: 24px grid, 1.6 stroke, round caps — SF Symbols "regular" feel. Always aria-hidden;
// the surrounding control carries the accessible name.

const P: Record<string, ReactNode> = {
  overview: (
    <>
      <rect x="3.5" y="3.5" width="7.5" height="9" rx="2.2" />
      <rect x="13" y="3.5" width="7.5" height="5.5" rx="2.2" />
      <rect x="3.5" y="14.5" width="7.5" height="6" rx="2.2" />
      <rect x="13" y="11" width="7.5" height="9.5" rx="2.2" />
    </>
  ),
  investments: <path d="M3.5 17.5 9 12l3.5 3.5L20.5 7.5M15 7.5h5.5V13" />,
  cash: (
    <>
      <rect x="2.5" y="6" width="19" height="12.5" rx="3" />
      <circle cx="12" cy="12.2" r="2.7" />
      <path d="M6 9.5v.01M18 15v.01" />
    </>
  ),
  budget: (
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12Z" />
      <path d="M15 3.8a8.5 8.5 0 0 1 5.2 5.2H15Z" />
    </>
  ),
  research: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m19.5 19.5-4.6-4.6M8 12l1.8-2.2 1.6 1.4L13.3 9" />
    </>
  ),
  journal: (
    <>
      <path d="M6 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5Z" />
      <path d="M8.5 8h6.5M8.5 12h6.5M8.5 16h4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.3 3h-4l-.3 2.6a7 7 0 0 0-2.1 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.1 1.2l.3 2.6h4l.3-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  check: <path d="m5.5 12.5 4 4 9-9.5" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m19.5 19.5-4.2-4.2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: <path d="M3.5 3.5l17 17M10 6c.6-.1 1.3-.2 2-.2 6 0 9.5 6.4 9.5 6.4a17 17 0 0 1-2.6 3.4M6.4 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.3-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 3v1.6M12 19.4V21M3 12h1.6M19.4 12H21M5.6 5.6l1.15 1.15M17.25 17.25l1.15 1.15M5.6 18.4l1.15-1.15M17.25 6.75l1.15-1.15" />
    </>
  ),
  moon: <path d="M19.5 14.2A7.5 7.5 0 0 1 9.8 4.5a7.5 7.5 0 1 0 9.7 9.7Z" />,
  system: (
    <>
      <rect x="3" y="4.5" width="18" height="12.5" rx="2.5" />
      <path d="M8.5 20.5h7M12 17v3.5" />
    </>
  ),
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  swap: <path d="M7 4.5 3.5 8 7 11.5M3.5 8h13M17 12.5l3.5 3.5-3.5 3.5M20.5 16h-13" />,
  pencil: <path d="M4.5 19.5h3.8L19 8.8a2.7 2.7 0 0 0-3.8-3.8L4.5 15.7v3.8ZM13.8 6.4l3.8 3.8" />,
  trash: (
    <>
      <path d="M4.5 6.8h15M9.6 6.8V5.2c0-.7.6-1.2 1.2-1.2h2.4c.7 0 1.2.5 1.2 1.2v1.6" />
      <path d="M6.3 6.8l.9 11.6c.1 1 .9 1.6 1.8 1.6h6c1 0 1.8-.7 1.8-1.6l.9-11.6M10 11v5M14 11v5" />
    </>
  ),
  tag: <path d="M3.5 12.4V5.5a2 2 0 0 1 2-2h6.9a2 2 0 0 1 1.4.6l6.6 6.6a2 2 0 0 1 0 2.8l-6.9 6.9a2 2 0 0 1-2.8 0L4.1 13.8a2 2 0 0 1-.6-1.4Z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5Z" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2" />
    </>
  ),
  logout: <path d="M14 4.5H7a2.5 2.5 0 0 0-2.5 2.5v10A2.5 2.5 0 0 0 7 19.5h7M10.5 12h10M17 8.5l3.5 3.5-3.5 3.5" />,
  download: <path d="M12 4v10.5M7.5 10 12 14.5 16.5 10M5 19.5h14" />,
  upload: <path d="M12 15V4.5M7.5 9 12 4.5 16.5 9M5 19.5h14" />,
  sparkle: <path d="M12 3.5c.6 4.3 2.2 6 6.5 6.5-4.3.6-5.9 2.2-6.5 6.5-.6-4.3-2.2-5.9-6.5-6.5 4.3-.5 5.9-2.2 6.5-6.5Z" />,
  alert: (
    <>
      <path d="M10.4 4.6 3.1 17.3A1.8 1.8 0 0 0 4.7 20h14.6a1.8 1.8 0 0 0 1.6-2.7L13.6 4.6a1.8 1.8 0 0 0-3.2 0Z" />
      <path d="M12 9.5v4.2M12 16.8h.01" />
    </>
  ),
  chevrons: <path d="m8 9.5 4-4 4 4M8 14.5l4 4 4-4" />,
  right: <path d="m9.5 6 6 6-6 6" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2.5" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  command: <path d="M9 6.5A2.5 2.5 0 1 0 6.5 9H9V6.5Zm0 0v11m0-11h6m-6 11A2.5 2.5 0 1 1 6.5 15H9v2.5Zm0 0h6m0-11A2.5 2.5 0 1 1 17.5 9H15V6.5Zm0 0v11m0 0a2.5 2.5 0 1 0 2.5-2.5H15v2.5Z" />,
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
}

export type IconName = keyof typeof P

export default function Icon({ name, size = 18, stroke = 1.6, className }: { name: string; size?: number; stroke?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {P[name]}
    </svg>
  )
}

/** App mark: an ascending curve inside a gold-rimmed obsidian tile. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" className="brand-svg">
      <defs>
        <linearGradient id="fos-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a2650" />
          <stop offset="1" stopColor="#0c0d14" />
        </linearGradient>
        <linearGradient id="fos-line" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#7c74ff" />
          <stop offset="1" stopColor="#e8c167" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#fos-bg)" />
      <rect x=".5" y=".5" width="31" height="31" rx="8.5" fill="none" stroke="#e8c167" strokeOpacity=".35" />
      <path d="M7 22.5 12.5 17l3.5 3 9-10" fill="none" stroke="url(#fos-line)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="25" cy="10" r="2.2" fill="#e8c167" />
    </svg>
  )
}
