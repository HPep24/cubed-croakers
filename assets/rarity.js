/* CUBED CROAKERS — rarity model. Statistical rarity: each trait value scores 3,333 ÷ (croakers sharing it). */
(function(){
"use strict";
const NAMES={
  heads:{H1:'Olive',H2:'Forest',H3:'Amber',H4:'Cobalt',H5:'Scarlet',H6:'Lime',H7:'Cyan',H8:'Violet',H9:'Magenta',H10:'Indigo',H11:'Jade',H12:'Rust'},
  leyes:{L1:'Prism Tear',L2:'Blue Moon',L3:'Yellow Slit',L4:'Triple Gold'},
  reyes:{R1:'Spiral Fish',R2:'Copper Tear',R3:'Crescent Grin',R4:'Steel Blade'},
  mouths:{M1:'Blue Tongue',M2:'Fangs',M3:'Red Lips',M4:'Chomp'},
  motion:{static:'Still',xray:'Glass Matrix',jelly:'Jelly Tears',genesis:'Genesis Bloom',vortex:'Vortex Prism',ripple:'Storm Ripple',melt:'Molten Melt',explode:'Supernova',spin:'Cyclone',shrink:'Singularity'}
};
function build(plan,cfg){
  const T=plan.tokens; const N=Object.keys(T).length;
  const cnt={bg:{},motion:{},head:{},left_eye:{},right_eye:{},mouth:{}};
  for(const t in T){const d=T[t];for(const k in cnt){cnt[k][d[k]]=(cnt[k][d[k]]||0)+1}}
  const rows=[];
  for(const t in T){const d=T[t];let score=0;const parts={};
    for(const k in cnt){const c=cnt[k][d[k]];const s=N/c;parts[k]={value:d[k],count:c,score:s};score+=s}
    if(d.crown){parts.crown={value:'The Crown',count:1,score:N};score+=N}
    rows.push({token:+t,score,parts,d});
  }
  rows.sort((a,b)=>b.score-a.score||a.token-b.token);
  const byToken={};rows.forEach((r,i)=>{r.rank=i+1;r.pct=(i+1)/N;byToken[r.token]=r});
  return {rows,byToken,cnt,N};
}
// overall badge from rank (distinct from background tiers)
function badge(rank,N,crown){
  if(crown)return {name:'The Crown',cls:'crown',note:'1 of 1 — the plan left one intersection standing'};
  const p=rank/N;
  if(p<=0.01)return {name:'Grail',cls:'grail',note:'top 1% of the collection'};
  if(p<=0.05)return {name:'Elite',cls:'elite',note:'top 5% of the collection'};
  if(p<=0.15)return {name:'Standout',cls:'standout',note:'top 15% of the collection'};
  if(p<=0.40)return {name:'Notable',cls:'notable',note:'top 40% of the collection'};
  return {name:'Foundation',cls:'foundation',note:'the bedrock of the collection'};
}
window.RARITY={NAMES,build,badge};
})();
