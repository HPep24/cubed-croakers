/* CUBED CROAKERS — shared helpers: hand-drawn vector marks + code-art generators */
(function(){
const NS='http://www.w3.org/2000/svg';

/* ---------- seeded PRNG ---------- */
function rng(seed){let a=seed>>>0||1;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let R=rng(1337);
function seed(s){R=rng(s)}
const rnd=(a=1,b)=>b===undefined?R()*a:a+R()*(b-a);

/* ---------- svg element helpers ---------- */
function el(tag,attrs={},parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
function svg(w,h,parent,attrs={}){const s=el('svg',Object.assign({width:w,height:h,viewBox:`0 0 ${w} ${h}`},attrs));if(parent)parent.appendChild(s);return s}

/* ---------- rough / hand-drawn primitives ---------- */
// wobbly polyline path string from points, jitter j, subdivisions per segment n
function wobble(pts,j=1.6,n=6){
  let d='';
  for(let i=0;i<pts.length-1;i++){
    const [x1,y1]=pts[i],[x2,y2]=pts[i+1];
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1;const nx=-dy/len,ny=dx/len;
    // slight overshoot/undershoot at ends like a quick pen
    const o1=rnd(-j*1.5,j*0.5),o2=rnd(-j*0.5,j*1.5);
    for(let k=0;k<=n;k++){
      const t=k/n;
      const bulge=Math.sin(t*Math.PI)*rnd(-j,j);
      let px=x1+dx*t+nx*bulge, py=y1+dy*t+ny*bulge;
      if(k===0){px+= -dx/len*o1; py+= -dy/len*o1}
      if(k===n){px+= dx/len*o2; py+= dy/len*o2}
      d+=(i===0&&k===0?'M':'L')+px.toFixed(2)+' '+py.toFixed(2)+' ';
    }
  }
  return d;
}
function stroke(parent,d,opts={}){
  return el('path',Object.assign({d,fill:'none',stroke:opts.color||'#111','stroke-width':opts.w||3,'stroke-linecap':'round','stroke-linejoin':'round',opacity:opts.op==null?1:opts.op},opts.extra||{}),parent);
}
// draw polyline twice (sketchy) — pass2 lighter
function sketchLine(parent,pts,opts={}){
  const g=el('g',{},parent);
  stroke(g,wobble(pts,opts.j??1.6,opts.n??6),opts);
  if(opts.double!==false) stroke(g,wobble(pts,(opts.j??1.6)*1.2,opts.n??6),Object.assign({},opts,{op:(opts.op==null?1:opts.op)*0.45,w:(opts.w||3)*0.8}));
  return g;
}
function sketchRect(parent,x,y,w,h,opts={}){
  const g=el('g',{},parent);
  if(opts.fill){el('rect',{x,y,width:w,height:h,fill:opts.fill,opacity:opts.fillOp==null?1:opts.fillOp},g)}
  if(opts.hatch){hatch(g,x,y,w,h,opts.hatch)}
  // four separate strokes with overshoot for a drawn look
  const c=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
  for(let i=0;i<4;i++){sketchLine(g,[c[i],c[(i+1)%4]],opts)}
  return g;
}
function sketchPoly(parent,pts,opts={}){
  const g=el('g',{},parent);
  if(opts.fill){el('polygon',{points:pts.map(p=>p.join(',')).join(' '),fill:opts.fill,opacity:opts.fillOp==null?1:opts.fillOp},g)}
  for(let i=0;i<pts.length;i++){sketchLine(g,[pts[i],pts[(i+1)%pts.length]],opts)}
  return g;
}
function sketchCircle(parent,cx,cy,r,opts={}){
  const g=el('g',{},parent);
  const n=opts.n||28,j=opts.j??Math.max(1,r*0.035);
  const pts=[];const start=rnd(0,Math.PI*2);
  for(let i=0;i<=n+1;i++){const a=start+i/n*Math.PI*2*1.03;const rr=r+rnd(-j,j);pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr])}
  if(opts.fill){el('circle',{cx,cy,r,fill:opts.fill,opacity:opts.fillOp==null?1:opts.fillOp},g)}
  let d='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L');
  stroke(g,d,opts);
  if(opts.double!==false){
    const pts2=[];const s2=rnd(0,Math.PI*2);
    for(let i=0;i<=n;i++){const a=s2+i/n*Math.PI*2*1.02;const rr=r+rnd(-j*1.4,j*1.4);pts2.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr])}
    stroke(g,'M'+pts2.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L'),Object.assign({},opts,{op:(opts.op==null?1:opts.op)*0.4,w:(opts.w||3)*0.8}));
  }
  return g;
}

function sketchEllipse(parent,cx,cy,rx,ry,opts={}){
  const g=el('g',{},parent);const n=opts.n||36,j=opts.j??Math.max(1,Math.min(rx,ry)*0.06);
  for(let pass=0;pass<(opts.double===false?1:2);pass++){
    const pts=[];const start=rnd(0,Math.PI*2);
    for(let i=0;i<=n+1;i++){const a=start+i/n*Math.PI*2*1.03;pts.push([cx+Math.cos(a)*(rx+rnd(-j,j)),cy+Math.sin(a)*(ry+rnd(-j,j))])}
    stroke(g,'M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L'),Object.assign({},opts,pass?{op:(opts.op==null?1:opts.op)*0.4,w:(opts.w||3)*0.8}:{}));
  }
  return g;
}
function sketchArrow(parent,x1,y1,x2,y2,opts={}){
  const g=el('g',{},parent);
  const curve=opts.curve||0; // perpendicular bulge
  const mx=(x1+x2)/2,my=(y1+y2)/2,dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1;const nx=-dy/len,ny=dx/len;
  const cx=mx+nx*curve,cy=my+ny*curve;
  // sample quadratic bezier into points then wobble
  const pts=[];for(let i=0;i<=10;i++){const t=i/10;pts.push([(1-t)*(1-t)*x1+2*(1-t)*t*cx+t*t*x2,(1-t)*(1-t)*y1+2*(1-t)*t*cy+t*t*y2])}
  sketchLine(g,pts,Object.assign({n:2},opts));
  // head
  const ang=Math.atan2(y2-cy,x2-cx),hl=opts.head||14;
  const a1=ang+Math.PI*0.8,a2=ang-Math.PI*0.8;
  sketchLine(g,[[x2+Math.cos(a1)*hl,y2+Math.sin(a1)*hl],[x2,y2],[x2+Math.cos(a2)*hl,y2+Math.sin(a2)*hl]],Object.assign({n:2,double:false},opts));
  return g;
}
function hatch(parent,x,y,w,h,o={}){
  const g=el('g',{},parent);
  const sp=o.spacing||9,ang=(o.angle==null?45:o.angle)*Math.PI/180,col=o.color||'#111',sw=o.w||1.6,op=o.op==null?0.9:o.op;
  const cp=el('clipPath',{id:'hc'+Math.floor(R()*1e9)},g);el('rect',{x,y,width:w,height:h},cp);
  const gg=el('g',{'clip-path':`url(#${cp.id})`},g);
  const diag=Math.hypot(w,h);const cxm=x+w/2,cym=y+h/2;
  const ux=Math.cos(ang),uy=Math.sin(ang),vx=-uy,vy=ux;
  for(let s=-diag/2;s<=diag/2;s+=sp){
    const px=cxm+vx*s,py=cym+vy*s;
    const p1=[px-ux*diag,py-uy*diag],p2=[px+ux*diag,py+uy*diag];
    stroke(gg,wobble([p1,p2],1.2,8),{color:col,w:sw,op});
  }
  return g;
}
function scribbleUnderline(parent,x1,x2,y,opts={}){
  const g=el('g',{},parent);
  sketchLine(g,[[x1,y],[x2,y+rnd(-2,2)]],Object.assign({j:2.2,n:8},opts));
  if(opts.twice!==false)sketchLine(g,[[x2-rnd(0,10),y+7],[x1+rnd(0,12),y+9]],Object.assign({j:2,n:8,double:false},opts));
  return g;
}
// hand-drawn X mark
function sketchX(parent,cx,cy,s,opts={}){const g=el('g',{},parent);sketchLine(g,[[cx-s,cy-s],[cx+s,cy+s]],opts);sketchLine(g,[[cx+s,cy-s],[cx-s,cy+s]],opts);return g}
// isometric wobbly cube. s = edge length
function sketchCube(parent,x,y,s,opts={}){
  const g=el('g',{},parent);
  const h=s*0.5, d=s*0.5; // simple oblique
  // front square (x,y) top-left ; top face offset up-right ; right face
  const F=[[x,y],[x+s,y],[x+s,y+s],[x,y+s]];
  const T=[[x,y],[x+d,y-h],[x+s+d,y-h],[x+s,y]];
  const Rr=[[x+s,y],[x+s+d,y-h],[x+s+d,y+s-h],[x+s,y+s]];
  const fills=opts.fills||[null,null,null];
  sketchPoly(g,T,Object.assign({},opts,{fill:fills[1]}));
  sketchPoly(g,Rr,Object.assign({},opts,{fill:fills[2],hatch:null}));
  if(opts.hatchRight)hatch(g,x+s,y-h,d,s+h,{color:opts.color,spacing:opts.hatchRight,angle:-60,w:1.4,op:.7});
  sketchPoly(g,F,Object.assign({},opts,{fill:fills[0]}));
  return g;
}
// simple hand-drawn crown
function sketchCrown(parent,cx,cy,w,h,opts={}){
  const pts=[[cx-w/2,cy+h/2],[cx-w/2,cy-h/6],[cx-w/4,cy+h/8],[cx,cy-h/2],[cx+w/4,cy+h/8],[cx+w/2,cy-h/6],[cx+w/2,cy+h/2],[cx-w/2,cy+h/2]];
  return sketchPoly(parent,pts,opts);
}
// hand-drawn cursor arrow
function sketchCursor(parent,x,y,s,opts={}){
  const pts=[[x,y],[x,y+s],[x+s*0.28,y+s*0.75],[x+s*0.48,y+s*1.05],[x+s*0.62,y+s*0.97],[x+s*0.45,y+s*0.68],[x+s*0.78,y+s*0.66]];
  return sketchPoly(parent,pts,opts);
}

/* ---------- serial grids ---------- */
// draw n cells in a grid of cols; colorFn(i) returns fill. returns rows used
function cellGrid(parent,x,y,cols,n,cell,gap,colorFn,opts={}){
  const g=el('g',{},parent);
  for(let i=0;i<n;i++){
    const c=i%cols,r=Math.floor(i/cols);
    const fill=colorFn(i);
    el('rect',{x:x+c*(cell+gap),y:y+r*(cell+gap),width:cell,height:cell,fill:fill,rx:opts.rx||0},g);
  }
  return {rows:Math.ceil(n/cols),g};
}

/* ---------- code-art canvas generators (static frames) ---------- */
function valueNoise(seedv){
  const r=rng(seedv);const P=new Uint8Array(512);const perm=[];for(let i=0;i<256;i++)perm[i]=i;for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));[perm[i],perm[j]]=[perm[j],perm[i]]}for(let i=0;i<512;i++)P[i]=perm[i&255];
  const h=(x,y)=>P[(P[x&255]+y)&255]/255;
  const sm=t=>t*t*(3-2*t);
  function n(x,y){const xi=Math.floor(x),yi=Math.floor(y);const xf=x-xi,yf=y-yi;const u=sm(xf),v=sm(yf);const a=h(xi,yi),b=h(xi+1,yi),c=h(xi,yi+1),d=h(xi+1,yi+1);return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v}
  return function fbm(x,y,oct=5){let v=0,a=.5,f=1;for(let i=0;i<oct;i++){v+=a*n(x*f,y*f);f*=2.03;a*=.5}return v}
}
function hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function mix(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}
function paint(ctx,w,h,fn,res=2){ // fn(u,v)->[r,g,b], computed at reduced res then scaled
  const cw=Math.ceil(w/res),ch=Math.ceil(h/res);const off=document.createElement('canvas');off.width=cw;off.height=ch;const oc=off.getContext('2d');const img=oc.createImageData(cw,ch);const d=img.data;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const c=fn(x/cw,y/ch);const i=(y*cw+x)*4;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255}
  oc.putImageData(img,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(off,0,0,w,h);
}
const ART={
  bloom(ctx,w,h,pal,sd=7){const f=valueNoise(sd);const cols=pal.map(hex2rgb);paint(ctx,w,h,(u,v)=>{const q1=f(u*3+f(u*2,v*2)*2,v*3);const q2=f(u*3+q1*3,v*3+q1*2);const t=Math.min(1,Math.max(0,q2*1.6-0.15));const k=t*(cols.length-1);const i=Math.floor(k);return mix(cols[i],cols[Math.min(cols.length-1,i+1)],k-i)})},
  fog(ctx,w,h,pal,sd=11){const f=valueNoise(sd);const cols=pal.map(hex2rgb);paint(ctx,w,h,(u,v)=>{const t=Math.pow(f(u*2.5,v*2.5,6),1.3)*1.4;const k=Math.min(1,t)*(cols.length-1);const i=Math.floor(k);return mix(cols[i],cols[Math.min(cols.length-1,i+1)],k-i)})},
  voronoi(ctx,w,h,pal,sd=3,n=22,edgeCol='#000'){const r=rng(sd);const pts=[];for(let i=0;i<n;i++)pts.push([r(),r(),Math.floor(r()*pal.length)]);const cols=pal.map(hex2rgb),ec=hex2rgb(edgeCol);paint(ctx,w,h,(u,v)=>{let d1=9,d2=9,k=0;for(const p of pts){const d=Math.hypot(u-p[0],(v-p[1])*h/w);if(d<d1){d2=d1;d1=d;k=p[2]}else if(d<d2)d2=d}const e=d2-d1;const c=cols[k];const shade=1-Math.min(1,d1*2.2)*0.35;const cc=[c[0]*shade,c[1]*shade,c[2]*shade];return e<0.012?ec:cc},2)},
  molten(ctx,w,h,pal,sd=5,n=26){const r=rng(sd);const pts=[];for(let i=0;i<n;i++)pts.push([r(),r()]);const dark=hex2rgb(pal[0]),mid=hex2rgb(pal[1]),hot=hex2rgb(pal[2]);paint(ctx,w,h,(u,v)=>{let d1=9,d2=9;for(const p of pts){const d=Math.hypot(u-p[0],(v-p[1])*h/w);if(d<d1){d2=d1;d1=d}else if(d<d2)d2=d}const e=d2-d1;const g=Math.exp(-e*38);return mix(mix(dark,mid,Math.min(1,g*1.3)),hot,Math.pow(g,3))},2)},
  hex(ctx,w,h,col,sd=9,size=16){const r=rng(sd);ctx.fillStyle='#050505';ctx.fillRect(0,0,w,h);const s=size,hh=Math.sqrt(3)*s;for(let row=-1;row<h/hh+1;row++)for(let c=-1;c<w/(1.5*s)+1;c++){const cx=c*1.5*s,cy=row*hh+(c%2?hh/2:0);const b=r();const a=b<0.15?1:b<0.5?0.35:0.12;ctx.strokeStyle=col;ctx.globalAlpha=a;ctx.lineWidth=b<0.15?2:1.2;ctx.beginPath();for(let i=0;i<6;i++){const ang=Math.PI/3*i;const x=cx+Math.cos(ang)*s*0.92,y=cy+Math.sin(ang)*s*0.92;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.stroke()}ctx.globalAlpha=1},
  matrix(ctx,w,h,col,sd=13,glyphs='₿',cell=13){const r=rng(sd);ctx.fillStyle='#030303';ctx.fillRect(0,0,w,h);ctx.font=`bold ${cell}px 'JetBrains Mono',monospace`;ctx.textBaseline='top';const cols=Math.ceil(w/cell);for(let c=0;c<cols;c++)for(let pass=0;pass<2;pass++){const len=Math.floor(3+r()*(h/cell)),start=Math.floor(r()*(h/cell*1.6))-h/cell*0.6;for(let i=0;i<len;i++){const y=(start+i)*cell;if(y<-cell||y>h)continue;const t=i/len;const g=glyphs[Math.floor(r()*glyphs.length)];ctx.globalAlpha=0.12+t*t*0.88;ctx.fillStyle=(i===len-1)?'#fff':col;ctx.fillText(g,c*cell,y)}}ctx.globalAlpha=1},
  tears(ctx,w,h,col,sd=17){const r=rng(sd);ctx.fillStyle='#050505';ctx.fillRect(0,0,w,h);const n=Math.floor(w/6);for(let i=0;i<n;i++){const x=r()*w,len=20+r()*h*0.5,y=r()*h;const grd=ctx.createLinearGradient(x,y-len,x,y);grd.addColorStop(0,'rgba(0,0,0,0)');grd.addColorStop(1,col);ctx.strokeStyle=grd;ctx.lineWidth=1.2+r()*1.2;ctx.globalAlpha=0.35+r()*0.65;ctx.beginPath();ctx.moveTo(x,y-len);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,1.2+r()*1.6,0,7);ctx.fill()}ctx.globalAlpha=1},
  aurora(ctx,w,h,pal,sd=21){const f=valueNoise(sd);const cols=pal.map(hex2rgb);paint(ctx,w,h,(u,v)=>{const q=f(u*2+f(u,v*3)*1.5,v*2.2+u*0.5,6);const band=Math.pow(Math.max(0,1-Math.abs((v-0.5)-(q-0.5)*0.9)*2.2),1.5);const t=Math.min(1,band*1.2);const k=t*(cols.length-1);const i=Math.floor(k);return mix(cols[i],cols[Math.min(cols.length-1,i+1)],k-i)})},
};
// hex-dump texture: text lines of pseudo-bytes
function hexDump(n,sd=5){const r=rng(sd);const out=[];for(let i=0;i<n;i++){let l=(i*16).toString(16).padStart(8,'0')+'  ';for(let k=0;k<16;k++)l+=Math.floor(r()*256).toString(16).padStart(2,'0')+' ';out.push(l)}return out}

const fmt=n=>n.toLocaleString('en-US');

window.CC={rng,seed,rnd,el,svg,wobble,stroke,sketchLine,sketchRect,sketchPoly,sketchCircle,sketchEllipse,sketchArrow,hatch,scribbleUnderline,sketchX,sketchCube,sketchCrown,sketchCursor,cellGrid,ART,hexDump,fmt,valueNoise};
})();
