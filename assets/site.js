/* CUBED CROAKERS — landing page logic */
(function(){
"use strict";
const CONFIG={
  VERIFY_MINT:true,                       // ask ACME whether an edition exists before revealing it
  API:'https://acme.pics/api/assets/',    // ACME indexer
  KNOWN_MINTED:10,                        // fallback floor if the indexer can't be reached from the browser (editions .0000–.0009 existed at build time)
  ASSET_URL:'https://acme.pics/asset/',
  MINT_URL:'https://acme.pics/asset/CROAKER',
  EDITIONS_URL:'https://acme.pics/dex/nft/editions/CROAKER',
  X_URL:'https://x.com/CubedCroakers',
  ARTIST_X:'https://x.com/HnftPepe',
  SITE_URL:'https://hpep24.github.io/cubed-croakers'                              // set to your domain (e.g. https://cubedcroakers.art) so shares link back here
};
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const pad4=n=>String(n).padStart(4,'0');
const fmt=n=>n.toLocaleString('en-US');
let DATA=null,PLAN=null,RAR=null;
const C=window.CROAK,R=window.RARITY,T=window.THUMBS;

/* ---------- boot: payload → plan → rarity ---------- */
async function boot(){
  DATA=await C.loadPayload();
  PLAN=C.solvePlan(DATA.cfg);
  RAR=R.build(PLAN,DATA.cfg);
  document.documentElement.dataset.ready='1';
  initFinder();initRandom();initCrown();initBgGrid();initParts();
  const q=new URLSearchParams(location.search).get('e');if(q)lookup(q,true);
}
/* ---------- stage 05: the four parts of one face, cropped from the real trait SVGs ---------- */
function initParts(){
  const el=$('#parts');if(!el)return;const d=PLAN.tokens[5];if(!d)return;   // CROAKER.0004 (minted) — the ticket in stage 01
  const keys=[d.head,d.left_eye,d.right_eye,d.mouth];
  el.innerHTML=keys.map(k=>`<span title="${k}">${DATA.traits[k]||''}</span>`).join('');
  const crop=()=>$$('span svg',el).forEach(s=>{try{const b=s.getBBox();if(!b.width)return;const p=Math.max(b.width,b.height)*.08;const side=Math.max(b.width,b.height)+2*p;s.setAttribute('viewBox',`${b.x+b.width/2-side/2} ${b.y+b.height/2-side/2} ${side} ${side}`);s.removeAttribute('width');s.removeAttribute('height')}catch(e){}});
  requestAnimationFrame(crop);
}
/* ---------- hero ---------- */
function initHero(){
  const urls=T.ring.map(n=>'assets/ring/'+n+'.webp');
  const boot=$('.hero-boot');
  if(!window.THREE){boot.textContent='';return}
  try{
    window.startRing($('#ring'),urls,()=>{boot.classList.add('gone');$('.hero-dom').classList.add('on')});
  }catch(e){boot.classList.add('gone');$('.hero-dom').classList.add('on')}
  setTimeout(()=>{boot.classList.add('gone');$('.hero-dom').classList.add('on')},6000);
}
/* ---------- reveal on scroll ---------- */
function initReveal(){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}}),{threshold:.15});
  $$('.reveal').forEach(el=>io.observe(el));
  const stages=$$('.stage');
  const so=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){stages.forEach((s,i)=>setTimeout(()=>s.classList.add('on'),i*180));so.disconnect()}},{threshold:.2});
  if(stages.length)so.observe(stages[0]);
  // counters
  const co=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target;co.unobserve(el);const to=+el.dataset.count;const dec=el.dataset.dec?+el.dataset.dec:0;const suf=el.dataset.suf||'';const t0=performance.now();
    (function step(){const p=Math.min(1,(performance.now()-t0)/1400);const v=to*(1-Math.pow(1-p,3));el.textContent=(dec?v.toFixed(dec):fmt(Math.round(v)))+suf;if(p<1)requestAnimationFrame(step)})()}),{threshold:.4});
  $$('[data-count]').forEach(el=>co.observe(el));
  // stairs
  const st=$('.stairs');if(st){const o=new IntersectionObserver(es=>{if(es[0].isIntersecting){$$('.stair',st).forEach((s,i)=>{const n=+s.dataset.n;const blocks=n/11;$$('i',s).forEach((b,k)=>setTimeout(()=>{b.style.height=(Math.floor(240/10)-4)+'px'},i*90+k*40))});o.disconnect()}},{threshold:.3});o.observe(st)}
}
/* ---------- piece rendering ---------- */
function pieceHtml(token,hideNumber){const d=PLAN.tokens[token];let h=C.buildPieceHtml(token,d,DATA.cfg,DATA.templates,DATA.traits,DATA.motion);
  if(hideNumber)h=h.replace(/<title>[^<]*<\/title>/,'<title>CUBED CROAKER</title>');   // showcase pieces never carry their number
  return h}
function mountPiece(frameEl,token,hideNumber){
  let f=frameEl.querySelector('iframe');
  if(!f){f=document.createElement('iframe');f.setAttribute('sandbox','allow-scripts');f.setAttribute('title','croaker');frameEl.appendChild(f)}
  f.srcdoc=pieceHtml(token,hideNumber);
  const ph=frameEl.querySelector('.ph');if(ph)ph.remove();
}
/* ---------- random summon (number hidden) ---------- */
function initRandom(){
  const btn=$('#summon');if(!btn)return;
  const info=$('#summon-info');
  let busy=false;
  const go=()=>{if(busy)return;busy=true;btn.disabled=true;
    const t=1+Math.floor(Math.random()*C.SUPPLY);const d=PLAN.tokens[t];
    mountPiece($('#summon-frame'),t,true);
    info.innerHTML=`<b>${DATA.cfg.bg_names[d.bg]}</b> · ${d.tier} background${d.motion!=='static'?` · <b>${R.NAMES.motion[d.motion]}</b> (Awakened)`:' · holds still'}${d.interactive?' · reacts to your cursor':''}<br><span class="dim">one of 3,333 — summoned in your browser from the same file that lives on Bitcoin</span>`;
    setTimeout(()=>{busy=false;btn.disabled=false},900)};
  btn.addEventListener('click',go);
  // auto-summon once visible
  const o=new IntersectionObserver(es=>{if(es[0].isIntersecting){go();o.disconnect()}},{threshold:.3});o.observe($('#summon-frame'));
}
/* ---------- the Crown ---------- */
function initCrown(){const fr=$('#crown-frame');if(!fr)return;const o=new IntersectionObserver(es=>{if(es[0].isIntersecting){mountPiece(fr,PLAN.crownTok,true);o.disconnect()}},{threshold:.2});o.observe(fr)}
/* ---------- background grid ---------- */
function initBgGrid(){
  const g=$('#bgs');if(!g)return;const cfg=DATA.cfg;
  const order=['BGL1','BGR1','BGR2','BGR3','BGR4','BGR5','BGR6','BGU1','BGU2','BGU3','BGU4','BGU5','BGU6','BGU7','BGU8','BGU9','BGC1','BGC2','BGC3','BGC4','BGC5','BGC6','BGC7','BGC8','BGC9','BGC10','BGC11','BGC12'];
  g.innerHTML=order.map(bg=>{const nm=T.byBg[bg];const tier=C.tierOf(cfg,bg);const cnt=cfg.bg_counts[bg];const cls=bg[2];
    return `<div class="bg ${cls}"><i class="tier"></i><img loading="lazy" src="assets/ring/${nm}.webp" alt="${cfg.bg_names[bg]}"><div class="nm">${cfg.bg_names[bg]}</div><div class="ct">${tier} · ${cnt} croakers${cfg.interactive_bgs.includes(bg)?' · reacts':''}</div></div>`}).join('');
}
/* ---------- finder ---------- */
function parseEdition(s){s=String(s||'').trim().toUpperCase().replace(/^CROAKER[\.\s#-]*/,'').replace(/^#/,'');if(!/^\d{1,4}$/.test(s))return null;const n=parseInt(s,10);if(n<0||n>C.SUPPLY-1)return null;return n}
async function verifyMinted(n){
  if(!CONFIG.VERIFY_MINT)return {ok:true};
  try{const r=await fetch(CONFIG.API+'CROAKER.'+pad4(n),{mode:'cors',cache:'no-store'});
    if(r.status===404)return {ok:false,reason:'unminted'};
    if(!r.ok)throw new Error('http '+r.status);
    const j=await r.json();if(!j||!j.result)return {ok:false,reason:'unminted'};
    return {ok:true,owner:j.result.owner};
  }catch(e){return n<CONFIG.KNOWN_MINTED?{ok:true,unverified:true}:{ok:false,reason:'unreachable'}}
}
function barWidth(count){const N=RAR.N;return Math.max(4,Math.min(100,100*Math.log(N/count)/Math.log(N)))}
function traitRow(k,label,value,code,count,gold){const N=RAR.N;return `<div class="trait"><div class="tk">${label}</div><div><div class="tv">${value}${code?`<small>${code}</small>`:''}</div><div class="bar"><i class="${gold?'gold':''}" data-w="${barWidth(count).toFixed(1)}"></i></div></div><div class="tn"><b>1 of ${fmt(count)}</b>${(100*count/N).toFixed(count<50?2:1)}% have it</div></div>`}
function showMsg(html){const m=$('#finder-msg');m.innerHTML=html;m.classList.remove('hidden');$('#result').classList.add('hidden')}
async function lookup(raw,fromUrl){
  const n=parseEdition(raw);const inp=$('#edition');
  if(n===null){showMsg('<span class="hand">Hmm.</span>Type the four digits of your edition — <b>0000</b> to <b>3332</b>, as it appears on acme.pics (CROAKER.0330 → 0330).');return}
  inp.value=pad4(n);
  const btn=$('#reveal');btn.disabled=true;btn.textContent='Checking the chain…';
  const v=await verifyMinted(n);
  btn.disabled=false;btn.textContent='Reveal';
  if(!v.ok){
    if(v.reason==='unminted')showMsg(`<span class="hand">Not summoned yet.</span><b>CROAKER.${pad4(n)}</b> hasn't been minted. The chain keeps its secrets until someone claims it — <a href="${CONFIG.MINT_URL}" target="_blank" rel="noopener"><b>mint one</b></a> and come back.`);
    else showMsg(`<span class="hand">Can't reach ACME right now.</span>We couldn't confirm that <b>CROAKER.${pad4(n)}</b> exists yet. If you hold it, open it on <a href="${CONFIG.ASSET_URL}CROAKER.${pad4(n)}" target="_blank" rel="noopener"><b>acme.pics</b></a> or try again in a moment.`);
    return;
  }
  reveal(n,v);
  if(!fromUrl)history.replaceState(null,'',location.pathname+'?e='+pad4(n)+'#find');
}
function reveal(n,v){
  const token=n+1;const row=RAR.byToken[token];const d=row.d;const cfg=DATA.cfg;const N=RAR.N;
  $('#finder-msg').classList.add('hidden');const res=$('#result');res.classList.remove('hidden');
  mountPiece($('#result-frame'),token);
  $('#r-id').textContent='CROAKER.'+pad4(n);
  $('#r-rank').innerHTML=`#${fmt(row.rank)}<small> of ${fmt(N)}</small>`;
  const pctTop=Math.max(0.03,100*row.rank/N);
  $('#r-pct').innerHTML=`${pctTop<1?pctTop.toFixed(2):pctTop<10?pctTop.toFixed(1):Math.round(pctTop)}%<small>TOP</small>`;
  const b=R.badge(row.rank,N,d.crown);const bd=$('#r-badge');bd.className='badge '+b.cls;bd.innerHTML=`<i></i>${b.name} · ${b.note}`;
  // gauge
  const circ=2*Math.PI*64;const filled=circ*(1-(row.rank-1)/N);const g=$('#gauge-fill');g.style.strokeDasharray=circ;g.style.strokeDashoffset=circ;requestAnimationFrame(()=>{g.style.transition='stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)';g.style.strokeDashoffset=circ-filled});
  // traits
  const p=row.parts;const rows=[
    traitRow('bg','Background',`${cfg.bg_names[d.bg]}<small>${d.tier}</small>`,'',p.bg.count,d.bg==='BGL1'),
    traitRow('motion','Motion',d.motion==='static'?'Holds still':`${R.NAMES.motion[d.motion]}<small>Awakened</small>`,'',p.motion.count,d.motion!=='static'),
    traitRow('head','Head',R.NAMES.heads[d.head],d.head,p.head.count,false),
    traitRow('le','Left eye',R.NAMES.leyes[d.left_eye],d.left_eye,p.left_eye.count,false),
    traitRow('re','Right eye',R.NAMES.reyes[d.right_eye],d.right_eye,p.right_eye.count,false),
    traitRow('mouth','Mouth',R.NAMES.mouths[d.mouth],d.mouth,p.mouth.count,false),
  ];
  const interCount=Object.values(PLAN.tokens).filter(x=>x.interactive===d.interactive).length;
  rows.push(traitRow('inter','Reacts to you',d.interactive?'Yes — hover and click it':'No — it holds its pose','',interCount,false));
  if(d.crown)rows.unshift(`<div class="trait"><div class="tk">Crown</div><div><div class="tv">THE CROWN<small>1 of 1</small></div><div class="bar"><i class="gold" data-w="100"></i></div></div><div class="tn"><b>1 of 1</b>the only one</div></div>`);
  $('#traits').innerHTML=rows.join('');
  requestAnimationFrame(()=>$$('#traits .bar i').forEach(i=>{i.style.width=i.dataset.w+'%'}));
  // rarest line
  const cand=[['bg',`its <b>${cfg.bg_names[d.bg]}</b> background`,p.bg.count],['motion',d.motion==='static'?null:`its <b>${R.NAMES.motion[d.motion]}</b> motion`,p.motion.count],['head',`its <b>${R.NAMES.heads[d.head]}</b> head`,p.head.count],['left_eye',`its <b>${R.NAMES.leyes[d.left_eye]}</b> left eye`,p.left_eye.count],['right_eye',`its <b>${R.NAMES.reyes[d.right_eye]}</b> right eye`,p.right_eye.count],['mouth',`its <b>${R.NAMES.mouths[d.mouth]}</b> mouth`,p.mouth.count]].filter(c=>c[1]).sort((a,b)=>a[2]-b[2]);
  let line=d.crown?`This is <b>the Crown</b> — the one croaker where the Legendary background meets the rarest motion. Rank #1 of 3,333, and it was never for sale at more than 4,200 sats.`:`Rarest thing about it: ${cand[0][1]} — only <b>${fmt(cand[0][2])}</b> of 3,333 have it.${cand[1]?` Then ${cand[1][1]} (${fmt(cand[1][2])}).`:''}`;
  $('#rarest').innerHTML=line;
  $('#r-owner').textContent=v.unverified?'mint status unverified':'verified on ACME ✓';
  $('#r-acme').href=CONFIG.ASSET_URL+'CROAKER.'+pad4(n);
  const share=`My CUBED CROAKER .${pad4(n)} ranks #${fmt(row.rank)} of 3,333 (${b.name}) — ${cfg.bg_names[d.bg]}${d.motion!=='static'?' · '+R.NAMES.motion[d.motion]:''}. One file, 3,333 croakers, forever trapped in the Bitcoin blockchain. @CubedCroakers ${CONFIG.SITE_URL?CONFIG.SITE_URL+'/?e='+pad4(n):CONFIG.ASSET_URL+'CROAKER.'+pad4(n)}`;
  $('#r-share').href='https://x.com/intent/tweet?text='+encodeURIComponent(share);
  res.scrollIntoView({behavior:'smooth',block:'start'});
}
function initFinder(){
  const inp=$('#edition'),btn=$('#reveal');if(!inp)return;
  inp.addEventListener('input',()=>{inp.value=inp.value.replace(/[^0-9]/g,'').slice(0,4)});
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')lookup(inp.value)});
  btn.addEventListener('click',()=>lookup(inp.value));
  $$('.eg').forEach(b=>b.addEventListener('click',()=>{inp.value=b.dataset.e;lookup(b.dataset.e)}));
  $('#again')&&$('#again').addEventListener('click',()=>{$('#result').classList.add('hidden');inp.value='';inp.focus();$('#find').scrollIntoView({behavior:'smooth'})});
}
function initNav(){const nav=$('.nav');if(!nav)return;const f=()=>nav.classList.toggle('solid',window.scrollY>60);f();window.addEventListener('scroll',f,{passive:true})}
function initVideos(){const vids=$$('.vid video');if(!vids.length)return;const o=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){v.play().catch(()=>{})}else v.pause()}),{threshold:.25});vids.forEach(v=>o.observe(v))}
document.addEventListener('DOMContentLoaded',()=>{initNav();initVideos();initHero();initReveal();boot().catch(e=>{console.error(e);const m=$('#finder-msg');if(m){m.classList.remove('hidden');m.innerHTML='This browser can\'t unpack the on-chain file (it needs DecompressionStream). Try a current Chrome, Safari or Firefox.'}})});
})();
