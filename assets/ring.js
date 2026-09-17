/* CUBED CROAKERS hero — "image ring" adapted from alphardex's WebGL Image Ring (three.js, kokomi.js, gsap)
   Rebuilt on plain three.js r128: three concentric rings of croakers (12 / 24 / 36), drag to spin, page scroll dives,
   post-pass shader: RGB shift + grain + vignette + iris transition. */
(function(){
"use strict";
const FRAG=`
uniform float iTime;uniform vec2 iResolution;uniform sampler2D tDiffuse;varying vec2 vUv;
uniform vec3 uBgColor;uniform float uRGBShiftIntensity;uniform float uGrainIntensity;uniform float uVignetteIntensity;uniform float uTransitionProgress;
highp float random(vec2 co){highp float a=12.9898;highp float b=78.233;highp float c=43758.5453;highp float dt=dot(co.xy,vec2(a,b));highp float sn=mod(dt,3.14);return fract(sin(sn)*c);}
vec3 grain(vec2 uv,vec3 col,float amount){float noise=random(uv+iTime);col+=(noise-.5)*amount;return col;}
vec4 RGBShift(sampler2D tex,vec2 uv,float amount){vec2 rUv=uv;vec2 gUv=uv;vec2 bUv=uv;float noise=random(uv+iTime)*.5+.5;vec2 offset=amount*vec2(cos(noise),sin(noise));rUv+=offset;gUv+=offset*.5;bUv+=offset*.25;vec4 rTex=texture2D(tex,rUv);vec4 gTex=texture2D(tex,gUv);vec4 bTex=texture2D(tex,bUv);return vec4(rTex.r,gTex.g,bTex.b,gTex.a);}
vec3 vignette(vec2 uv,vec3 col,vec3 vigColor,float amount){vec2 p=uv;p-=.5;float d=length(p);float mask=smoothstep(.5,.3,d);mask=pow(mask,.6);float mixFactor=(1.-mask)*amount;return mix(col,vigColor,mixFactor);}
float sdCircle(vec2 p,float r){return length(p)-r;}
vec3 transition(vec2 uv,vec3 col,float progress){float ratio=iResolution.x/iResolution.y;vec2 p=uv;p-=.5;p.x*=ratio;float d=sdCircle(p,progress*sqrt(2.2));float c=smoothstep(-.2,0.,d);return mix(uBgColor,col,1.-c);}
void main(){vec2 uv=vUv;vec4 tex=RGBShift(tDiffuse,uv,uRGBShiftIntensity);vec3 col=tex.xyz;col=grain(uv,col,uGrainIntensity);col=vignette(uv,col,uBgColor,uVignetteIntensity);col=transition(uv,col,uTransitionProgress);gl_FragColor=vec4(col,1.);}`;
const VERT=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;

function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function tween(obj,to,dur,delay,cb){const from={};for(const k in to)from[k]=obj[k];const t0=performance.now()+delay*1000;
  function step(){const now=performance.now();if(now<t0){requestAnimationFrame(step);return}const p=Math.min(1,(now-t0)/(dur*1000));const e=ease(p);for(const k in to)obj[k]=from[k]+(to[k]-from[k])*e;if(p<1)requestAnimationFrame(step);else if(cb)cb()}
  requestAnimationFrame(step)}

window.startRing=function(container,urls,onReady){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bg=new THREE.Color('#070707');
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.setClearColor(bg,1);
  container.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(75,1,.1,300);camera.position.set(0,0,16);
  const params={transitionProgress:0,enterProgress:0,rotateSpeed:15};
  const scroll={target:0,current:0,delta:0};
  let W=1,H=1;
  const rt=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat});
  const post=new THREE.ShaderMaterial({vertexShader:VERT,fragmentShader:FRAG,uniforms:{iTime:{value:0},iResolution:{value:new THREE.Vector2(1,1)},tDiffuse:{value:rt.texture},
    uBgColor:{value:bg},uRGBShiftIntensity:{value:.0025},uGrainIntensity:{value:.05},uVignetteIntensity:{value:.7},uTransitionProgress:{value:0}}});
  const quad=new THREE.Mesh(new THREE.PlaneBufferGeometry(2,2),post);const postScene=new THREE.Scene();postScene.add(quad);const postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  function resize(){W=container.clientWidth||1;H=container.clientHeight||1;renderer.setSize(W,H);camera.aspect=W/H;camera.position.z=W/H<0.8?24:W/H<1.2?19:16;camera.updateProjectionMatrix();const pr=renderer.getPixelRatio();rt.setSize(W*pr,H*pr);post.uniforms.iResolution.value.set(W,H)}
  resize();window.addEventListener('resize',resize);

  // textures
  const loader=new THREE.TextureLoader();
  const loads=urls.map(u=>new Promise(res=>loader.load(u,t=>{t.minFilter=THREE.LinearMipmapLinearFilter;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());res(t)},undefined,()=>res(null))));
  Promise.all(loads).then(texs=>{
    texs=texs.filter(Boolean);if(!texs.length)return;
    const sum=n=>n*(n+1)/2;const isOdd=n=>n%2===1;
    const circleCount=3,unit=12,r=6.4,scale=1.0;
    const rings=[],lines=[];
    const material=new THREE.MeshBasicMaterial({toneMapped:false});
    let k=0;
    for(let i=0;i<circleCount;i++){
      const count=unit*(i+1);const ring=new THREE.Group();scene.add(ring);rings.push(ring);
      for(let j=0;j<count;j++){
        const tex=texs[k%texs.length];k++;
        const line=new THREE.Group();ring.add(line);lines.push(line);
        const size=1.75*scale*(i*0.36+1);
        const mesh=new THREE.Mesh(new THREE.PlaneBufferGeometry(size,size),Object.assign(material.clone(),{map:tex}));
        mesh.material.needsUpdate=true;
        mesh.position.x=r*(i+1);mesh.rotation.z=-Math.PI/2;line.rotation.z=j/count*Math.PI*2;line.add(mesh);
      }
    }
    // drag to spin (horizontal), page scroll to dive
    let dragging=false,lx=0,ly=0;
    const el=container;
    el.addEventListener('pointerdown',e=>{dragging=true;lx=e.clientX;ly=e.clientY;el.setPointerCapture&&el.setPointerCapture(e.pointerId)});
    el.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;scroll.target-=(Math.abs(dx)>Math.abs(dy)?dx:dy)*2});
    const up=()=>{dragging=false};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('pointerleave',up);
    let lastY=window.scrollY;window.addEventListener('scroll',()=>{const y=window.scrollY;scroll.target+=(y-lastY)*1.6;lastY=y},{passive:true});
    const clock=new THREE.Clock();
    let visible=true;new IntersectionObserver(en=>{visible=en[0].isIntersecting},{threshold:0}).observe(container);
    function frame(){
      requestAnimationFrame(frame);
      if(!visible)return;
      scroll.current+=(scroll.target-scroll.current)*0.1;scroll.delta=scroll.target-scroll.current;
      const d=Math.max(-600,Math.min(600,scroll.delta));
      rings.forEach((ring,i)=>{ring.rotation.z+=0.0025*(isOdd(i)?-1:1)*(1+d*(reduce?0.2:1))*params.rotateSpeed*(reduce?0.3:1)});
      const zpush=-THREE.MathUtils.lerp(0,100,THREE.MathUtils.clamp(Math.abs(d)/1000,0,1))+THREE.MathUtils.lerp(10,0,params.enterProgress);
      lines.forEach(l=>{l.position.z=zpush});
      post.uniforms.iTime.value=clock.getElapsedTime();post.uniforms.uTransitionProgress.value=params.transitionProgress;
      renderer.setRenderTarget(rt);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCam);
    }
    frame();
    // enter animation (gsap timeline equivalent)
    tween(params,{transitionProgress:1},1.0,0);
    params.enterProgress=0;params.rotateSpeed=10;
    tween(params,{enterProgress:1,rotateSpeed:1},1.5,0);
    if(onReady)onReady();
  });
};
})();
