import { fmtN, fmtD, esc, num, N, D, Pct, bcl, ago, dFmt, sum, isUSD, hVal, IC, PALETTE, MONTHS, WDAYS, DIVS, $ } from './config.js';
import { infoBtn, openExplainer } from './explainers.js';
import { CHART_POINTS, CHART_ANALYSES } from './data.js';

export function makeSparklineSVG(pts, support, resistance, col='var(--c-gain)', h=46) {
  if (!pts || pts.length < 2) return '';
  const min = Math.min(...pts, support) * 0.96;
  const max = Math.max(...pts, resistance) * 1.04;
  const range = max - min || 1;
  const W = 280, H = h, pad = 6;
  const scaleX = i => (i / (pts.length - 1)) * (W - pad * 2) + pad;
  const scaleY = v => H - pad - ((v - min) / range) * (H - pad * 2);

  const coords = pts.map((v, i) => [scaleX(i), scaleY(v)]);
  let d = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1], curr = coords[i];
    const cpx = ((prev[0] + curr[0]) / 2).toFixed(1);
    d += ` C ${cpx} ${prev[1].toFixed(1)}, ${cpx} ${curr[1].toFixed(1)}, ${curr[0].toFixed(1)} ${curr[1].toFixed(1)}`;
  }
  const areaD = `${d} L ${coords[coords.length - 1][0].toFixed(1)} ${H} L ${coords[0][0].toFixed(1)} ${H} Z`;
  const last = coords[coords.length - 1];
  const supY = scaleY(support).toFixed(1);
  const resY = scaleY(resistance).toFixed(1);
  const gid = 'g-' + Math.random().toString(36).substr(2, 6);

  return `
  <div style="margin:6px 0 8px; position:relative;">
    <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:${H}px; overflow:visible;" preserveAspectRatio="none">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${col}" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="${col}" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <!-- Resistance line -->
      <line x1="${pad}" y1="${resY}" x2="${W-pad}" y2="${resY}" stroke="var(--c-loss)" stroke-width="1" stroke-dasharray="3,3" opacity="0.4"/>
      <!-- Support line -->
      <line x1="${pad}" y1="${supY}" x2="${W-pad}" y2="${supY}" stroke="var(--c-gain)" stroke-width="1" stroke-dasharray="3,3" opacity="0.4"/>
      <!-- Area fill -->
      <path d="${areaD}" fill="url(#${gid})"/>
      <!-- Price trend line -->
      <path d="${d}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round"/>
      <!-- Active pulse point -->
      <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3.5" fill="${col}"/>
      <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="6" fill="${col}" opacity="0.25"/>
    </svg>
  </div>`;
}

export let activeChartFilter = 'all';
export function setChartFilter(f) {
  activeChartFilter = f;
  const grid = document.getElementById('chart-grid');
  if (!grid) return;
  const allCards = ['ARADEL', 'UCAP', 'ZENITHBANK', 'SEPLAT', 'UPDC', 'BUAFOODS', 'JBERGER', 'NGXGROUP', 'TRANSCORP', 'MAYBAKER', 'NIDF'];
  const filtered = allCards.filter(k => {
    if (f === 'portfolio') return ['ARADEL', 'UCAP', 'ZENITHBANK'].includes(k);
    if (f === 'baggers') return ['SEPLAT', 'UPDC', 'BUAFOODS', 'JBERGER', 'ARADEL', 'BUACEMENT', 'NGXGROUP', 'TRANSCORP', 'MAYBAKER'].includes(k);
    if (f === 'arbitrage') return k === 'NIDF';
    return true;
  });
  grid.innerHTML = filtered.map(renderChartCard).join('');
  document.querySelectorAll('.chart-filter-btn').forEach(btn => {
    btn.style.background = btn.dataset.f === f ? 'var(--c-accent)' : 'var(--c-s2)';
    btn.style.color = btn.dataset.f === f ? '#fff' : 'var(--c-ink2)';
  });
}


export let activeTerminalTicker = 'ARADEL';

export function selectTerminalStock(ticker) {
  activeTerminalTicker = ticker;
  const container = document.getElementById('pro-chart-station-container');
  if (container) {
    container.innerHTML = renderProChartStation(ticker);
  }
}

export function renderProChartStation(k) {
  const c = CHART_ANALYSES[k];
  if (!c) return '';
  const pts = CHART_POINTS[k] || [c.support, c.price, c.resistance];
  const range = Math.max(c.resistance - c.support, 1);
  const pct = Math.min(Math.max(((c.price - c.support) / range) * 100, 0), 100);
  
  const W = 600, H = 140, pad = 20;
  const min = Math.min(...pts, c.support) * 0.95;
  const max = Math.max(...pts, c.resistance) * 1.05;
  const rng = max - min || 1;
  const scaleX = i => (i / (pts.length - 1)) * (W - pad * 2) + pad;
  const scaleY = v => H - pad - ((v - min) / rng) * (H - pad * 2);
  
  const coords = pts.map((v, i) => [scaleX(i), scaleY(v)]);
  let d = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1], curr = coords[i];
    const cpx = ((prev[0] + curr[0]) / 2).toFixed(1);
    d += ` C ${cpx} ${prev[1].toFixed(1)}, ${cpx} ${curr[1].toFixed(1)}, ${curr[0].toFixed(1)} ${curr[1].toFixed(1)}`;
  }
  const areaD = `${d} L ${coords[coords.length - 1][0].toFixed(1)} ${H} L ${coords[0][0].toFixed(1)} ${H} Z`;
  const last = coords[coords.length - 1];
  const supY = scaleY(c.support).toFixed(1);
  const resY = scaleY(c.resistance).toFixed(1);
  const col = c.statusCol || 'var(--c-gain)';
  const gid = 'term-g-' + k;

  return `
  <div class="card c12" id="pro-chart-station" style="padding:22px; border-left: 3px solid var(--c-accent); position:relative;">
    <!-- Top Bar: Asset Info & Action Badges -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; margin-bottom:14px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:24px; font-weight:800; letter-spacing:-0.03em;">${k}</span>
          <span style="font-size:13px; color:var(--c-ink3); font-weight:500;">· ${c.name}</span>
          <span class="tag" style="background:var(--c-s2); color:${col}; border:1px solid var(--c-border); font-weight:700; font-size:11px;">${c.status}</span>
          ${infoBtn('pro_chart', 'Pro Chart Terminal Mechanics')}
        </div>
        <div style="display:flex; align-items:baseline; gap:12px; margin-top:4px;">
          <span class="num-hero" style="font-size:32px;">${k==='NIDF'?'₦'+c.price.toFixed(2):fmtN(c.price)}</span>
          <span style="font-size:13px; color:var(--c-ink2);">Support: <b>${fmtN(c.support)}</b> · Resistance: <b>${fmtN(c.resistance)}</b></span>
        </div>
      </div>
      
      <!-- Interactive Selector Pills -->
      <div style="display:flex; gap:6px; flex-wrap:wrap; max-width:540px;">
        ${['ARADEL', 'UCAP', 'ZENITHBANK', 'SEPLAT', 'UPDC', 'BUAFOODS', 'JBERGER', 'NGXGROUP', 'TRANSCORP', 'MAYBAKER', 'NIDF'].map(t => `
          <button onclick="selectTerminalStock('${t}')" style="padding:6px 12px; font-size:11px; font-weight:700; border-radius:8px; border:1px solid var(--c-border); background:${t===k?'var(--c-accent)':'var(--c-s2)'}; color:${t===k?'#fff':'var(--c-ink2)'}; cursor:pointer; transition:all .15s ease;">
            ${t}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Main High-Res Chart Area -->
    <div style="margin:14px 0; background:var(--c-s2); border-radius:12px; border:1px solid var(--c-border); padding:16px 20px; position:relative;">
      <!-- Resistance Ceiling Label -->
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--c-loss); opacity:0.9; margin-bottom:4px;">
        <span>Resistance Ceiling: <b>${fmtN(c.resistance)}</b></span>
        <span>Target: <b>${c.action.includes('targets')?c.action.split('targets')[1].split('.')[0]:'Upside Runway'}</b></span>
      </div>

      <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:125px; overflow:visible;" preserveAspectRatio="none">
        <defs>
          <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${col}" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="${col}" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <line x1="${pad}" y1="${resY}" x2="${W-pad}" y2="${resY}" stroke="var(--c-loss)" stroke-width="1.2" stroke-dasharray="4,4" opacity="0.4"/>
        <line x1="${pad}" y1="${supY}" x2="${W-pad}" y2="${supY}" stroke="var(--c-gain)" stroke-width="1.2" stroke-dasharray="4,4" opacity="0.4"/>
        <path d="${areaD}" fill="url(#${gid})"/>
        <path d="${d}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="4.5" fill="${col}"/>
        <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="9" fill="${col}" opacity="0.25"/>
      </svg>

      <!-- Support Floor Label -->
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--c-gain); opacity:0.9; margin-top:6px;">
        <span>Support Floor: <b>${fmtN(c.support)}</b></span>
        <span style="color:var(--c-ink3);">Range Position: <b>${pct.toFixed(0)}% to Breakout</b></span>
      </div>
    </div>

    <!-- 4 Executive Metrics Grid -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin-bottom:14px;">
      <div style="background:var(--c-s2); padding:10px 12px; border-radius:10px; border:1px solid var(--c-border);">
        <div style="font-size:10px; color:var(--c-ink3); text-transform:uppercase; font-weight:700;">Moving Average Momentum</div>
        <div style="font-size:12px; font-weight:600; color:var(--c-ink); margin-top:3px;">${c.ma}</div>
      </div>
      <div style="background:var(--c-s2); padding:10px 12px; border-radius:10px; border:1px solid var(--c-border);">
        <div style="font-size:10px; color:var(--c-ink3); text-transform:uppercase; font-weight:700;">Volume Confirmation Trigger</div>
        <div style="font-size:12px; font-weight:600; color:var(--c-ink); margin-top:3px;">${c.volume}</div>
      </div>
      <div style="background:var(--c-s2); padding:10px 12px; border-radius:10px; border:1px solid var(--c-border);">
        <div style="font-size:10px; color:var(--c-ink3); text-transform:uppercase; font-weight:700;">3-Pillar Quality Score</div>
        <div style="font-size:12px; font-weight:700; color:var(--c-gain); margin-top:3px;">Earnings: 9.2 · Val: 8.8 · Solv: 9.5</div>
      </div>
      <div style="background:var(--c-s2); padding:10px 14px; border-radius:10px; border:1px solid var(--c-border);">
        <div style="font-size:10px; color:var(--c-ink3); text-transform:uppercase; font-weight:700;">Execution Stance</div>
        <div style="font-size:12px; font-weight:700; color:var(--c-accent); margin-top:3px;">Asymmetric Upside Bias</div>
      </div>
    </div>

    <!-- Strategic Verdict & Execution Plan -->
    <div style="background:var(--c-s2); border-radius:10px; padding:12px 16px; border-left:3px solid var(--c-gain); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div style="max-width:850px;">
        <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--c-gain); margin-bottom:2px;">CFO Execution Directive</div>
        <div style="font-size:13px; color:var(--c-ink2); line-height:1.5;">
          <b>Catalyst:</b> ${c.setup}<br>
          <b>Action:</b> ${c.action}
        </div>
      </div>
      <button class="btn btn-primary" data-act="chart-detail" data-t="${k}" style="font-size:11px; padding:7px 14px;">
        Full Dossier ↗
      </button>
    </div>
  </div>`;
}

export function renderChartCard(k) {
  const c = CHART_ANALYSES[k];
  if (!c) return '';
  const range = Math.max(c.resistance - c.support, 1);
  const pct = Math.min(Math.max(((c.price - c.support) / range) * 100, 0), 100);
  const pts = CHART_POINTS[k] || [c.support, c.price, c.resistance];
  const chartSVG = makeSparklineSVG(pts, c.support, c.resistance, c.statusCol || 'var(--c-gain)', 46);

  return `
  <div class="card c6" style="display:flex; flex-direction:column; justify-content:space-between; cursor:pointer; transition:transform .2s, box-shadow .2s;" data-act="chart-detail" data-t="${k}">
    <div>
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
        <div>
          <div style="font-weight:700; font-size:15px; letter-spacing:-0.02em;">${k} <span style="font-weight:400; font-size:12px; color:var(--c-ink3);">· ${c.name}</span></div>
          <div class="num-lg" style="margin-top:2px; font-variant-numeric:tabular-nums;">${k==='NIDF'?'₦'+c.price.toFixed(2):fmtN(c.price)}</div>
        </div>
        <span class="tag" style="background:var(--c-s2); color:${c.statusCol}; border:1px solid var(--c-border); font-weight:600; font-size:11px;">${c.status}</span>
      </div>

      <!-- Live SVG Breakout Sparkline Chart -->
      ${chartSVG}

      <!-- Price Range Slider -->
      <div style="margin:6px 0 10px;">
        <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--c-ink3); margin-bottom:4px;">
          <span>Floor: <b>${fmtN(c.support)}</b></span>
          <span style="color:var(--c-ink2);">${pct.toFixed(0)}% to Breakout</span>
          <span>Ceiling: <b>${fmtN(c.resistance)}</b></span>
        </div>
        <div style="height:6px; background:var(--c-s3); border-radius:99px; position:relative; overflow:hidden;">
          <div style="position:absolute; left:0; top:0; bottom:0; width:${pct}%; background:linear-gradient(90deg, var(--c-gain), var(--c-accent)); border-radius:99px;"></div>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:4px; font-size:12px; color:var(--c-ink2); margin-top:6px;">
        <div><b>Moving Averages:</b> ${c.ma}</div>
        <div><b>Volume Trigger:</b> ${c.volume}</div>
      </div>
    </div>

    <div style="margin-top:12px; padding-top:10px; border-top:1px solid var(--c-border); display:flex; justify-content:space-between; align-items:center; font-size:12px;">
      <span style="color:var(--c-ink); font-weight:600;">Plan: ${c.action.split('.')[0]}</span>
      <span style="color:var(--c-accent); font-weight:600; font-size:11px; display:inline-flex; align-items:center; gap:2px;">View Dossier ↗</span>
    </div>
  </div>`;
}

/* ─── CHARTS ───────────────────────────────────────────── */
export function donut(items) {
  const T=sum(items,i=>i.v)||1; let off=25;
  const segs=items.map((it,k)=>{
    const p=it.v/T*100, c=PALETTE[k%PALETTE.length];
    const s=`<circle class="donut-seg" r="15.9" cx="21" cy="21" fill="none" stroke="${c}" stroke-width="4"
      stroke-dasharray="${p.toFixed(2)} ${(100-p).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"/>`;
    off-=p; return s;
  });
  return `<svg viewBox="0 0 42 42" width="96" style="flex:none">${segs.join('')}</svg>`;
}

export function lineChart(pts) {
  if(!pts||pts.length<2) return `<p style="color:var(--c-ink3);font-size:13px;padding:8px 0">Tap "Record snapshot" monthly to build your history chart.</p>`;
  const W=480,H=130, vs=pts.map(p=>p.v);
  const mx=Math.max(...vs),mn=Math.min(...vs);
  const pad=(mx-mn||mx||1)*.1, a=mn-pad, b=mx+pad;
  const X=i=>16+i*(W-32)/(pts.length-1), Y=v=>H-16-(v-a)/(b-a||1)*(H-30);
  const d=pts.map((p,i)=>`${i?'L':'M'}${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="overflow:visible">
    <defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="${PALETTE[0]}" stop-opacity=".18"/>
      <stop offset="1" stop-color="${PALETTE[0]}" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${d}L${X(pts.length-1).toFixed(1)},${H-16}L${X(0).toFixed(1)},${H-16}Z" fill="url(#lg)"/>
    <path class="line-anim" pathLength="1" d="${d}" fill="none" stroke="${PALETTE[0]}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    ${pts.map((p,i)=>`<circle cx="${X(i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="2.5" fill="${PALETTE[0]}"/>
      ${(pts.length<=7||i%Math.ceil(pts.length/5)===0)?`<text x="${X(i).toFixed(1)}" y="${H-1}" text-anchor="middle">${esc(p.l)}</text>`:''}`).join('')}
  </svg>`;
}

/* ─── CALENDAR ─────────────────────────────────────────── */
export function calHTML(y = (typeof window !== 'undefined' && window.calY ? window.calY : new Date().getFullYear()), m = (typeof window !== 'undefined' && window.calM !== undefined ? window.calM : new Date().getMonth())) {
  const now=new Date(), fd=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate();
  const evs={};
  DIVS.forEach(d=>{ if(d.m===m){if(!evs[15])evs[15]=[]; evs[15].push(`${d.label} ${d.type}`);} });
  let cells='';
  for(let i=0;i<fd;i++) cells+='<div class="cal-cell empty"></div>';
  for(let d=1;d<=days;d++){
    const isToday=d===now.getDate()&&m===now.getMonth()&&y===now.getFullYear();
    const hasEv=!!evs[d];
    cells+=`<div class="cal-cell${isToday?' today':''}${hasEv?' ev':''}"${hasEv?` title="${esc(evs[d].join(' · '))}"`:''}>${d}</div>`;
  }
  const up=DIVS.map(d=>{let dt=new Date(y,d.m,15);if(dt<now)dt=new Date(y+1,d.m,15);return{...d,dt};})
    .sort((a,b)=>a.dt-b.dt).slice(0,5);
  return `
  <div class="cal-hdr">
    <button class="cal-nav" data-cal="prev">‹</button>
    <span class="cal-month">${MONTHS[m]} ${y}</span>
    <button class="cal-nav" data-cal="next">›</button>
  </div>
  <div class="cal-grid">${WDAYS.map(d=>`<div class="cal-hd">${d}</div>`).join('')}${cells}</div>
  <div class="up-list">
    <p class="meta2" style="margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Upcoming Payouts</p>
    ${up.map(d=>{
      const days=Math.ceil((d.dt-now)/86400000);
      return `<div class="up-row">
        <div><div style="font-size:13px;font-weight:600">${d.label}</div>
          <div class="meta2">${d.type} dividend · ${dFmt(d.dt)}</div></div>
        <span class="badge ${days<30?'b-warn':'b-neu'}">${days}d</span>
      </div>`;
    }).join('')}
  </div>`;
}

/* ─── HOLDING ROW ──────────────────────────────────────── */
export function hrow(h) {
  const pl = h.avg>0 ? (h.price/h.avg-1)*100 : null;
  return `<button class="h-row" data-act="detail" data-t="${esc(h.ticker)}">
    <div>
      <div class="h-ticker">${esc(h.ticker)}</div>
      <div class="h-name">${esc(h.name)}</div>
    </div>
    <div class="h-right">
      <div class="h-val">${isUSD(h)?fmtD(h.units*h.price):fmtN(hVal(h))}</div>
      <div class="h-units">${h.units.toLocaleString()} unit${h.units!==1?'s':''}</div>
    </div>
    ${pl!==null?`<span class="badge ${bcl(pl)}">${Pct(pl)}</span>`:`<span class="badge b-neu">—</span>`}
  </button>`;
}

if (typeof window !== 'undefined') {
  Object.assign(window, {
    makeSparklineSVG,
    setChartFilter,
    selectTerminalStock,
    renderProChartStation,
    renderChartCard,
    donut,
    lineChart,
    calHTML,
    hrow,
  });
}

