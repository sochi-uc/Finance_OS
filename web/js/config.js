// Craftsman Micro-interactions
document.addEventListener('mousemove', e => {
  document.querySelectorAll('.card').forEach(card => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
});

export const ACCENTS = [
  { c: '#6e3ff3', h: '#7c4ff5' },
  { c: '#0a84ff', h: '#1e90ff' },
  { c: '#ff453a', h: '#ff5c53' },
  { c: '#ff9f0a', h: '#ffb340' },
  { c: '#30d158', h: '#42d86a' },
  { c: '#bf5af2', h: '#ca71f4' },
];

export let currentAccentIdx = parseInt(localStorage.getItem('accentIdx')) || 0;

export function applyAccent() {
  const a = ACCENTS[currentAccentIdx];
  document.documentElement.style.setProperty('--c-accent', a.c);
  document.documentElement.style.setProperty('--c-accent-h', a.h);
}
applyAccent();

export function toggleAccent() {
  currentAccentIdx = (currentAccentIdx + 1) % ACCENTS.length;
  localStorage.setItem('accentIdx', currentAccentIdx);
  applyAccent();
}

/* ─── SVG ICON LIBRARY ─────────────────────────────────── */
export const IC = {
  drop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>`,
  home:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>`,
  chart:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`,
  dollar:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`,
  list:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  pen:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  eye:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeoff:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  sun:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  moon:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`,
  close:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  gem:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="2"/><polyline points="2 8.5 12 14 22 8.5"/></svg>`,
  cam:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  send:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

/* ─── CONSTANTS ────────────────────────────────────────── */
export const QUOTES = [
  { text: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { text: "Expense reduction has a mathematical zero-bound, while capital generation has infinite upside. Focus on high-leverage systems and skill acquisition.", author: "Capital Allocation Axiom" },
  { text: "Wealth is what you don't see. It's the investments compounding quietly in the background.", author: "Morgan Housel" },
  { text: "Infrastructure debt funds lock in predictable quarterly cash flows, eliminating the cognitive drag of speculative market timing.", author: "Fixed-Income Principle" },
  { text: "Compound interest is the eighth wonder of the world. He who understands it, earns it.", author: "Albert Einstein" },
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { text: "Never chase breakouts on thin liquidity. Institutional volume confirmation is required before capital commitment.", author: "Market Mechanics" },
  { text: "Risk is what remains after you have accounted for every predictable variable.", author: "Portfolio Theory" }
];

let quoteIdx = 0;
let quoteTimer = null;

export function startQuotes() {
  if (quoteTimer) clearInterval(quoteTimer);
  const qText = document.getElementById('q-text');
  const qAuth = document.getElementById('q-auth');
  if (!qText || !qAuth) return;
  
  quoteTimer = setInterval(() => {
    const el = document.getElementById('quote-box');
    if (el) {
      el.style.opacity = 0;
      setTimeout(() => {
        quoteIdx = (quoteIdx + 1) % QUOTES.length;
        qText.innerText = `"${QUOTES[quoteIdx].text}"`;
        qAuth.innerText = `— ${QUOTES[quoteIdx].author}`;
        el.style.opacity = 1;
      }, 400);
    }
  }, 10000);
}

export const TABS = [
  {id:'home', label:'Overview', icon:IC.home},
  {id:'ngn',  label:'Naira',    icon:IC.chart},
  {id:'usd',  label:'Dollar',   icon:IC.dollar},
  {id:'cash', label:'Budget',   icon:IC.list},
  {id:'foresight', label:'Foresight', icon:IC.gem},
  {id:'log',  label:'Ledger',   icon:IC.pen},
];

export const PALETTE = ['#6e3ff3','#30d158','#0a84ff','#ff9f0a','#ff453a','#64d2ff'];
export const MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const WDAYS   = ['S','M','T','W','T','F','S'];
export const DIVS    = [
  {ticker:'ZENITHBANK',label:'Zenith',  type:'Interim',m:7},
  {ticker:'ZENITHBANK',label:'Zenith',  type:'Final',  m:3},
  {ticker:'UCAP',      label:'UCAP',    type:'Interim',m:5},
  {ticker:'UCAP',      label:'UCAP',    type:'Final',  m:3},
  {ticker:'ARADEL',    label:'Aradel',  type:'Interim',m:7},
  {ticker:'ARADEL',    label:'Aradel',  type:'Final',  m:3},
];

/* ─── HELPERS ──────────────────────────────────────────── */
export const $    = s => document.querySelector(s);
export const esc  = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export const num  = v => +String(v||0).replace(/,/g,'');
export const fmtN = x => '₦'+Math.round(+x||0).toLocaleString('en-NG');
export const fmtD = x => '$'+(+x||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
export const N    = x => `<span class="pnum">${fmtN(x)}</span>`;
export const D    = x => `<span class="pnum">${fmtD(x)}</span>`;
export const Pct  = x => (x>=0?'▲ ':'▼ ')+Math.abs(+x||0).toFixed(1)+'%';
export const bcl  = x => x>=0?'b-up':'b-dn';
export const ago  = t => new Date(t).toLocaleString([],{dateStyle:'medium',timeStyle:'short'});
export const dFmt = t => new Date(t).toLocaleDateString([],{month:'short',day:'numeric'});
export const sum  = (a,f)=>(a||[]).reduce((t,b)=>t+f(b),0);
export const isUSD= h => h.ccy==='USD';
export const getFx = () => +(typeof window !== 'undefined' && window.S?.settings?.fx) || 1500;
export const fx    = getFx;
export const afx   = () => {
  const s = typeof window !== 'undefined' && window.S?.settings;
  return (s?.usd_funded > 0) ? s.ngn_spent / s.usd_funded : fx();
};
export const hVal  = (h, rate = getFx()) => isUSD(h) ? h.units * h.price * rate : h.units * h.price;

// Window fallback compatibility
if (typeof window !== 'undefined') {
  Object.assign(window, {
    fx,
    afx,
    getFx,
    hVal,
    ACCENTS,
    applyAccent,
    toggleAccent,
    IC,
    QUOTES,
    startQuotes,
    TABS,
    PALETTE,
    MONTHS,
    WDAYS,
    DIVS,
    $,
    esc,
    num,
    fmtN,
    fmtD,
    N,
    D,
    Pct,
    bcl,
    ago,
    dFmt,
    sum,
    isUSD,
  });
}
