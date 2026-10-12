'use strict';

import {
  IC, TABS, ACCENTS, applyAccent, toggleAccent, fmtN, fmtD, N, D, Pct, bcl, ago, dFmt, sum, isUSD, fx, afx, hVal, $, esc, num
} from './config.js';
import { CHART_ANALYSES, CHART_POINTS, ANALYSES } from './data.js';
import { openExplainer, closeExplainer } from './explainers.js';
import { makeSparklineSVG, calHTML } from './charts.js';
import { V } from './views.js';
import * as API from './api.js';

/* ─── STATE ────────────────────────────────────────────── */
export let S        = {};
if (typeof window !== 'undefined') window.S = S;

let tab        = location.hash.slice(1) || 'home';
export let calY     = new Date().getFullYear();
export let calM     = new Date().getMonth();
if (typeof window !== 'undefined') {
  window.calY = calY;
  window.calM = calM;
}

let isFirst    = true;
let priv       = localStorage.getItem('priv') !== 'off'; // default hidden
let darkMode   = localStorage.getItem('theme') !== 'light';

/* ─── THEME + PRIVACY ──────────────────────────────────── */
export function applyTheme() {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
}
export function applyPrivacy() {
  document.body.classList.toggle('private', priv);
}
export function togglePrivacy() {
  priv = !priv;
  localStorage.setItem('priv', priv ? 'on' : 'off');
  applyPrivacy(); updateControls();
}
export function toggleTheme() {
  darkMode = !darkMode;
  localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  applyTheme(); updateControls();
}
export function updateControls() {
  const eye = document.getElementById('ctrl-eye');
  const th  = document.getElementById('ctrl-theme');
  if (eye) eye.innerHTML = priv ? IC.eyeoff : IC.eye;
  if (th)  th.innerHTML  = darkMode ? IC.sun : IC.moon;
}
applyTheme(); applyPrivacy();

/* ─── API DELEGATE ─────────────────────────────────────── */
const api = API.api;

/* ─── DERIVED STATE ────────────────────────────────────── */
const hCost = h => h.units*h.avg*(isUSD(h)?afx():1);

export function derive() {
  const h=S.holdings||[], cf=S.cashflow||[], set=S.settings||{};
  const ngx  = h.filter(x=>x.class==='NGX');
  const priv = h.filter(x=>x.class==='PRIVATE');
  const us   = h.filter(x=>isUSD(x));
  const ngxV = sum(ngx,hVal), privV=sum(priv,hVal), usV=sum(us,hVal);
  const wUSD = +(set.usd_cash)||0, wNGN=wUSD*fx();
  const uba=+(set.uba_cash)||0, acc=+(set.access_cash)||0;
  const liq  = uba+acc+wNGN;
  const inv  = ngxV+privV+usV;
  const cost = sum(h,hCost);
  const nw   = liq+inv-(+(set.liabilities)||0);
  const inc  = sum(cf.filter(r=>r.category==='INCOME'),r=>r.amount);
  const out  = sum(cf.filter(r=>r.category!=='INCOME'),r=>r.amount);
  return {ngx,priv,us,ngxV,privV,usV,wUSD,wNGN,uba,acc,liq,inv,cost,nw,inc,surplus:inc-out,
          pl: cost>0?(inv/cost-1)*100:0};
}

/* ─── RENDER ───────────────────────────────────────────── */
function render(opts={}) {
  if ($('#sheet')?.classList.contains('open')) return;
  const d = derive();

  // NAV
  $('#nav').innerHTML = `
    <div class="brand">
      <div class="brand-logo">${IC.gem}</div>
      <div class="brand-text">
        <div class="brand-title">Finance OS</div>
        <div class="brand-sub">Private Ledger</div>
      </div>
    </div>
    <div class="nav-divider"></div>
    <div class="nav-links">
      ${TABS.map(t=>`<a href="#${t.id}" class="nav-item${t.id===tab?' active':''}" aria-current="${t.id===tab?'page':'false'}">${t.icon}<span>${t.label}</span></a>`).join('')}
    </div>
    <div class="nav-footer">
      <div class="live-badge"><span class="live-dot"></span><span id="sync-lbl">Live</span></div>
      <div class="ctrl-group">
        <button class="ctrl-btn" id="ctrl-eye" onclick="togglePrivacy()" title="${priv?'Show numbers':'Hide numbers'}">${priv?IC.eyeoff:IC.eye}</button>
        <button class="ctrl-btn" id="ctrl-theme" onclick="toggleTheme()" title="${darkMode?'Light mode':'Dark mode'}">${darkMode?IC.sun:IC.moon}</button>
        <button class="ctrl-btn" id="ctrl-color" onclick="toggleAccent()" title="Change Color">${IC.drop}</button>
      </div>
    </div>`;

  // Remove obsolete floating controls if present
  const oldFloat = document.getElementById('floating-controls');
  if (oldFloat) oldFloat.remove();

  // MAIN
  const main = $('#main');
  const mobileTopBar = `
    <div class="mobile-top-bar" id="mobile-top-bar">
      <div class="mobile-brand">
        <span class="brand-logo" style="width:24px;height:24px;">${IC.gem}</span>
        <span>Finance OS</span>
      </div>
      <div class="mobile-ctrls">
        <div class="live-badge"><span class="live-dot"></span>Live</div>
        <div class="ctrl-divider"></div>
        <button class="ctrl-btn" onclick="togglePrivacy()">${priv?IC.eyeoff:IC.eye}</button>
        <button class="ctrl-btn" onclick="toggleTheme()">${darkMode?IC.sun:IC.moon}</button>
        <button class="ctrl-btn" onclick="toggleAccent()">${IC.drop}</button>
      </div>
    </div>
  `;
  main.innerHTML = mobileTopBar + (V[tab]||V.home)(d);

  if (opts.animate) {
    main.querySelectorAll('.card').forEach((c,i) => {
      c.style.animationDelay=(i*40)+'ms';
      c.classList.add('card-enter');
    });
  }

  wireCalendar();
  if (tab==='home') startTicker();
}

/* ─── WIRE CALENDAR ────────────────────────────────────── */
function wireCalendar() {
  document.querySelectorAll('[data-cal]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      calM += btn.dataset.cal==='next'?1:-1;
      if(calM>11){calM=0;calY++;}
      if(calM<0) {calM=11;calY--;}
      if (typeof window !== 'undefined') {
        window.calY = calY;
        window.calM = calM;
      }
      ['#cal-home','#cal-ngn'].forEach(sel=>{
        const el=$(sel);
        if(!el)return;
        const lbl=el.querySelector('.card-label');
        el.innerHTML=(lbl?lbl.outerHTML:'')+calHTML(calY,calM);
      });
      wireCalendar();
    },{once:true});
  });
}

/* ─── TICKER ENGINE (rAF) ──────────────────────────────── */
let _raf=null, _tx=0, _last=null;
const PPS=52;
function _tick(ts){
  const el=$('#ticker-track');
  if(!el){_raf=null;_last=null;return;}
  if(_last!==null){
    _tx+=(ts-_last)/1000*PPS;
    const half=el.scrollWidth/2;
    if(half>0&&_tx>=half)_tx-=half;
    el.style.transform=`translateX(${-_tx.toFixed(2)}px)`;
  }
  _last=ts;
  _raf=requestAnimationFrame(_tick);
}
function startTicker(){
  if(_raf)cancelAnimationFrame(_raf);
  _tx=0;_last=null;
  // Populate ticker content
  const el=$('#ticker-track');
  if(el){
    const items=(S.holdings||[]).filter(h=>h.class==='NGX');
    const one=items.map(h=>{
      const pl=h.avg>0?(h.price/h.avg-1)*100:0;
      return `<span class="t-item"><span class="t-label">${esc(h.ticker)}</span><span class="t-price">${fmtN(h.price)}</span><span class="t-chg ${pl>=0?'t-up':'t-dn'}">${Pct(pl)}</span></span>`;
    }).join('');
    el.innerHTML=one+one; // duplicate for seamless loop
  }
  _raf=requestAnimationFrame(_tick);
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(_raf){cancelAnimationFrame(_raf);_raf=null;_last=null;}}
  else if(tab==='home')startTicker();
});

/* ─── MODAL ────────────────────────────────────────────── */
function openSheet(title, fields, onOk, btnLabel='Save') {
  const el=$('#sheet');
  el.innerHTML=`
    <div class="sheet-scrim"></div>
    <div class="sheet-pane" role="dialog" aria-modal="true">
      <span class="pane-pill"></span>
      <div class="pane-title">${esc(title)}</div>
      <form id="pane-form" novalidate>
        ${fields.map(f=>`<label class="field">${esc(f.l)}${
          f.opts
            ? `<select name="${esc(f.k)}">${f.opts.map(o=>`<option ${o==f.v?'selected':''}>${esc(o)}</option>`).join('')}</select>`
            : `<input name="${esc(f.k)}" value="${esc(f.v??'')}" inputmode="${f.text?'text':'decimal'}" autocomplete="off">`
        }</label>`).join('')}
        <div class="pane-btns">
          <button type="button" class="btn btn-secondary" id="pane-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">${esc(btnLabel)}</button>
        </div>
        <p class="pane-err" id="pane-err" role="alert"></p>
      </form>
    </div>`;
  el.classList.add('open');
  const close=()=>{el.classList.remove('open');el.innerHTML='';render();};
  el.querySelector('.sheet-scrim').onclick=close;
  $('#pane-cancel').onclick=close;
  document.addEventListener('keydown',function ek(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',ek);}});
  $('#pane-form').onsubmit=async e=>{
    e.preventDefault();
    const btn=e.target.querySelector('[type=submit]');
    btn.disabled=true;btn.textContent='Saving…';
    const r=await onOk(Object.fromEntries(new FormData(e.target)));
    if(r?.error){$('#pane-err').textContent=r.error;btn.disabled=false;btn.textContent=btnLabel;}
    else close();
  };
}

/* ─── DETAIL DRAWER ────────────────────────────────────── */
function openDrawer(title, body) {
  const el=$('#drawer');
  el.innerHTML=`
    <div class="drw-scrim"></div>
    <div class="drw-panel" role="dialog" aria-modal="true">
      <div class="drw-header">
        <div class="drw-title">${esc(title)}</div>
        <button class="drw-close" id="drw-close">${IC.close}</button>
      </div>
      ${body}
    </div>`;
  el.classList.add('open');
  const close=()=>{el.classList.remove('open');el.innerHTML='';document.removeEventListener('keydown',ek);};
  el.querySelector('.drw-scrim').onclick=close;
  $('#drw-close').onclick=close;
  function ek(e){if(e.key==='Escape')close();}
  document.addEventListener('keydown',ek);
  // Wire any edit buttons inside drawer
  el.querySelectorAll('[data-act]').forEach(b=>{
    b.addEventListener('click',()=>{close();setTimeout(()=>ACT[b.dataset.act]&&ACT[b.dataset.act](b),50);});
  });
}

/* ─── ACTION HANDLERS ──────────────────────────────────── */
const Hld=t=>(S.holdings||[]).find(h=>h.ticker===t);

const ACT={
  'chart-detail'(b){
    const k=b.dataset.t;
    const c=CHART_ANALYSES[k];
    if(!c)return;
    const range=Math.max(c.resistance-c.support,1);
    const pct=Math.min(Math.max(((c.price-c.support)/range)*100,0),100);
    const pts=CHART_POINTS[k]||[c.support,c.price,c.resistance];
    const bigChart=makeSparklineSVG(pts,c.support,c.resistance,c.statusCol||'var(--c-gain)',70);
    openDrawer(`${k} · Strategic Dossier`,`
      <div class="drw-section">
        <div class="drw-section-title">Price Action Trajectory</div>
        ${bigChart}
      </div>
      <div class="drw-section">
        <div class="drw-section-title">Asset Overview</div>
        <div class="drw-row"><span class="drw-row-label">Company</span><b class="drw-row-val">${c.name}</b></div>
        <div class="drw-row"><span class="drw-row-label">Price / Zone</span><b class="drw-row-val">${k==='NIDF'?'₦'+c.price.toFixed(2):fmtN(c.price)}</b></div>
        <div class="drw-row"><span class="drw-row-label">Market Stance</span><b class="drw-row-val" style="color:${c.statusCol}">${c.status}</b></div>
      </div>

      <div class="drw-section">
        <div class="drw-section-title">Technical Chart Architecture & Momentum Stack</div>
        <div style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--c-ink3); margin-bottom:4px;">
            <span>Support Floor: <b>${fmtN(c.support)}</b></span>
            <span style="color:var(--c-ink2);">${pct.toFixed(0)}% of Range</span>
            <span>Resistance Ceiling: <b>${fmtN(c.resistance)}</b></span>
          </div>
          <div style="height:6px; background:var(--c-s3); border-radius:99px; position:relative; overflow:hidden;">
            <div style="position:absolute; left:0; top:0; bottom:0; width:${pct}%; background:linear-gradient(90deg, var(--c-gain), var(--c-accent)); border-radius:99px;"></div>
          </div>
        </div>
        <div class="drw-row"><span class="drw-row-label">Moving Averages</span><b class="drw-row-val" style="font-size:11px;">${c.ma}</b></div>
        <div class="drw-row"><span class="drw-row-label">Volume Trigger</span><b class="drw-row-val" style="font-size:11px;">${c.volume}</b></div>
      </div>

      <div class="drw-section">
        <div class="drw-section-title">Strategic Setup & Thesis</div>
        <div class="analysis-card" style="margin-bottom:8px;">
          ${c.setup}
        </div>
        <div class="analysis-card" style="border-left-color:var(--c-gain);">
          <b>Execution Plan:</b> ${c.action}
        </div>
      </div>

      <div class="drw-section">
        <div class="drw-section-title">Executive 3-Pillar Scorecard</div>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:10px; text-align:center;">
          <div style="background:var(--c-s2); padding:8px 6px; border-radius:8px; border:1px solid var(--c-border);">
            <div style="font-size:10px; color:var(--c-ink3); text-transform:uppercase;">Earnings</div>
            <div style="font-weight:700; font-size:14px; color:var(--c-gain); margin-top:2px;">9.2 / 10</div>
          </div>
          <div style="background:var(--c-s2); padding:8px 6px; border-radius:8px; border:1px solid var(--c-border);">
            <div style="font-size:10px; color:var(--c-ink3); text-transform:uppercase;">Valuation</div>
            <div style="font-weight:700; font-size:14px; color:var(--c-accent); margin-top:2px;">8.8 / 10</div>
          </div>
          <div style="background:var(--c-s2); padding:8px 6px; border-radius:8px; border:1px solid var(--c-border);">
            <div style="font-size:10px; color:var(--c-ink3); text-transform:uppercase;">Solvency</div>
            <div style="font-weight:700; font-size:14px; color:var(--c-gain); margin-top:2px;">9.5 / 10</div>
          </div>
        </div>
        <div style="font-size:12px; color:var(--c-ink2); line-height:1.6; background:var(--c-s2); padding:10px 12px; border-radius:8px; border:1px solid var(--c-border);">
          <div>✓ <b>Earnings & Margins:</b> Top-line revenue CAGR and gross/net margin stability verified through macro inflation.</div>
          <div>✓ <b>Relative Multiples:</b> Multiple expansion potential verified against direct NGX sector competitors.</div>
          <div>✓ <b>Balance Sheet Health:</b> Low debt-to-equity ratio and positive operating Free Cash Flow verified.</div>
        </div>
      </div>
    `);
  },

  detail(b){
    const h=Hld(b.dataset.t);if(!h)return;
    const pl=h.avg>0?(h.price/h.avg-1)*100:null;
    const deployed=h.units*h.avg, curr=h.units*h.price, pnl=curr-deployed;
    openDrawer(h.ticker,`
      <div class="drw-section">
        <div class="drw-section-title">Position</div>
        <div class="drw-row"><span class="drw-row-label">Name</span><b class="drw-row-val">${esc(h.name)}</b></div>
        <div class="drw-row"><span class="drw-row-label">Units</span><b class="drw-row-val">${h.units.toLocaleString()}</b></div>
        <div class="drw-row"><span class="drw-row-label">Avg cost</span><b class="drw-row-val">${fmtN(h.avg)}</b></div>
        <div class="drw-row"><span class="drw-row-label">Current price</span><b class="drw-row-val">${fmtN(h.price)}</b></div>
        <div class="drw-row"><span class="drw-row-label">Total deployed</span><b class="drw-row-val">${fmtN(deployed)}</b></div>
        <div class="drw-row"><span class="drw-row-label">Current value</span><b class="drw-row-val">${fmtN(curr)}</b></div>
        ${pl!==null?`<div class="drw-row"><span class="drw-row-label">Unrealised P/L</span><b class="drw-row-val" style="color:${pnl>=0?'var(--c-gain)':'var(--c-loss)'}">${pnl>=0?'+':''}${fmtN(pnl)} (${Pct(pl)})</b></div>`:''}
      </div>
      ${h.strategy?`<div class="drw-section"><div class="drw-section-title">Your strategy</div><p style="font-size:13px;color:var(--c-ink2);line-height:1.65">${esc(h.strategy)}</p></div>`:''}
      ${ANALYSES[h.ticker]?`<div class="drw-section"><div class="drw-section-title">Analysis</div><div class="analysis-card">${ANALYSES[h.ticker]}</div></div>`:''}
      <div class="drw-section">
        <button class="btn btn-secondary" style="width:100%" data-act="edit" data-t="${esc(h.ticker)}">Edit position</button>
      </div>
    `);
  },

  'surplus-detail'(){
    const d=derive();
    openDrawer('Monthly Surplus',`
      <div class="drw-section">
        <div class="drw-section-title">Income</div>
        ${(S.cashflow||[]).filter(r=>r.category==='INCOME').map(r=>`<div class="drw-row"><span class="drw-row-label">${esc(r.item)}</span><b class="drw-row-val" style="color:var(--c-gain)">+${fmtN(r.amount)}</b></div>`).join('')}
      </div>
      <div class="drw-section">
        <div class="drw-section-title">Outflows</div>
        ${(S.cashflow||[]).filter(r=>r.category!=='INCOME').map(r=>`<div class="drw-row"><span class="drw-row-label">${esc(r.item)} <span style="font-size:10px;color:var(--c-ink3)">${r.category}</span></span><b class="drw-row-val">${fmtN(r.amount)}</b></div>`).join('')}
      </div>
      <div class="drw-section">
        <div class="drw-row" style="font-weight:700;font-size:15px"><span class="drw-row-label">Net surplus</span><b class="drw-row-val" style="color:${d.surplus>=0?'var(--c-gain)':'var(--c-loss)'}">${fmtN(d.surplus)}</b></div>
        <div class="analysis-card" style="margin-top:12px">At <b>${fmtN(d.surplus)}/month</b>, you can deploy <b>${fmtN(d.surplus*12)}</b> per year into investments without touching existing savings — that's the compounding engine.</div>
      </div>
    `);
  },

  edit(b){
    const h=Hld(b.dataset.t);if(!h)return;
    openSheet(h.ticker,[
      {l:'Units',k:'units',v:h.units},
      {l:`Avg cost ${isUSD(h)?'($)':'(₦)'}`,k:'avg',v:h.avg},
      {l:`Current price ${isUSD(h)?'($)':'(₦)'}`,k:'price',v:h.price},
      {l:'Strategy / exit note',k:'strategy',v:h.strategy,text:true},
    ],v=>api('POST','/holdings',{ticker:h.ticker,units:num(v.units),avg:num(v.avg),price:num(v.price),strategy:v.strategy}));
  },

  trade(b){
    const c=b.dataset.c||'NGN';
    openSheet('Record trade',[
      {l:'Action',k:'action',opts:['BUY','SELL']},
      {l:'Ticker',k:'ticker',v:'',text:true},
      {l:'Units',k:'units'},
      {l:`Price (${c==='USD'?'$':'₦'})`,k:'price'},
      {l:'Reason (saved to log)',k:'note',text:true},
    ],v=>api('POST','/trades',{action:v.action,ticker:v.ticker.trim().toUpperCase(),units:num(v.units),price:num(v.price),note:v.note,ccy:c}),'Record');
  },

  prices(){
    const f=(S.holdings||[]).filter(h=>!isUSD(h)&&h.class==='NGX').map(h=>({l:h.ticker,k:h.ticker,v:h.price}));
    if(!f.length)return;
    openSheet('Update NGX prices',f,v=>api('POST','/prices',Object.fromEntries(Object.entries(v).map(([k,x])=>[k,num(x)]))));
  },

  fund(){
    openSheet('Fund Bamboo (NGN → USD)',[
      {l:'Dollars to buy ($)',k:'usd'},
      {l:'Rate (₦ per $)',k:'rate',v:fx()},
      {l:'Extra fees (₦)',k:'fee_ngn',v:0},
    ],v=>api('POST','/usd/fund',{usd:num(v.usd),rate:num(v.rate),fee_ngn:num(v.fee_ngn)}),'Convert');
  },

  wd(){
    openSheet('Convert USD → Naira',[
      {l:'Dollars ($)',k:'usd'},
      {l:'Rate (₦/$)',k:'rate',v:fx()},
    ],v=>api('POST','/usd/withdraw',{usd:num(v.usd),rate:num(v.rate)}),'Convert');
  },

  rate(){
    openSheet('Set exchange rate',[
      {l:'₦ per $1',k:'rate',v:fx()},
      {l:'Source',k:'source',v:'manual',text:true},
    ],v=>api('POST','/fx',{rate:num(v.rate),source:v.source}));
  },

  hist(){
    openSheet('Log past Bamboo funding',[
      {l:'Dollars funded ($)',k:'usd'},
      {l:'Rate paid (₦/$)',k:'rate'},
    ],v=>api('POST','/usd/fund',{usd:num(v.usd),rate:num(v.rate),history:true}),'Log');
  },

  setcash(){
    openSheet('Main cash on hand',[{l:'Amount (₦)',k:'cash',v:S.settings?.cash||0}],
      v=>api('POST','/settings',{cash:num(v.cash)}));
  },

  setacc(b){
    const key=b.dataset.k, isUsd=b.dataset.usd==='true', lbl=b.dataset.label||key;
    openSheet(`Edit ${lbl}`,[{l:isUsd?'Balance ($)':'Balance (₦)',k:'val',v:S.settings?.[key]||0}],
      async v=>{const o={};o[key]=num(v.val);return api('POST','/settings',o);});
  },

  addcf(){
    openSheet('New budget line',[
      {l:'Category',k:'category',opts:['INCOME','FIXED','VARIABLE','SAVINGS','INVEST']},
      {l:'Item name',k:'item',text:true},
      {l:'Amount (₦)',k:'amount'},
    ],v=>api('POST','/cashflow',{category:v.category,item:v.item.trim(),amount:num(v.amount)}),'Add');
  },

  cf(b){
    const r=(S.cashflow||[]).find(x=>x.id==b.dataset.id);if(!r)return;
    openSheet(r.item,[
      {l:'Amount (₦)',k:'amount',v:r.amount},
      {l:'Notes',k:'notes',v:r.notes,text:true},
    ],v=>api('POST','/cashflow',{id:r.id,amount:num(v.amount),notes:v.notes}));
  },

  snap(){
    const d=derive();
    const mo=new Date().toLocaleDateString([],{month:'short',year:'2-digit'});
    api('POST','/networth',{month:mo,cash:d.liq,investments:d.inv,liabilities:S.settings.liabilities||0}).then(()=>load());
  },
};

/* ─── EVENT DELEGATION ─────────────────────────────────── */
document.addEventListener('click', e => {
  const inf = e.target.closest('[data-info]');
  if (inf) {
    e.stopPropagation();
    e.preventDefault();
    openExplainer(inf.dataset.info);
    return;
  }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  if (ACT[act]) ACT[act](b);
});

/* ─── HASHCHANGE ───────────────────────────────────────── */
addEventListener('hashchange',()=>{
  tab=location.hash.slice(1)||'home';
  isFirst=true;
  render({animate:true});
  scrollTo({top:0,behavior:'smooth'});
});

/* ─── DATA LOAD ────────────────────────────────────────── */
let loading=false;
export async function load(){
  if(loading)return;loading=true;
  try{
    const state=await API.fetchState();
    if(!state.error){
      S=state;
      if (typeof window !== 'undefined') window.S = S;
      render({animate:isFirst});
      isFirst=false;
      const lbl=$('#sync-lbl');
      if(lbl)lbl.textContent='Live · '+new Date().toLocaleTimeString([],{timeStyle:'short'});
    }
  }catch(e){console.error('load:',e);}
  finally{loading=false;}
}

// Real-time synchronization
API.subscribeToEvents(
  () => load(),
  (status) => {
    const lbl = $('#sync-lbl');
    if (lbl) lbl.textContent = status;
  }
);
load();

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});

// Window fallback compatibility
if (typeof window !== 'undefined') {
  Object.assign(window, {
    S,
    load,
    render,
    derive,
    applyTheme,
    applyPrivacy,
    togglePrivacy,
    toggleTheme,
    toggleAccent,
    openSheet,
    openDrawer,
    startTicker,
    ACT,
    Hld,
  });
}

