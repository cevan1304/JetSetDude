const INTRO_MEDIA={"title":"assets/intro_title.webp","story":"assets/intro_story.webp"};
// Intro lifecycle is separate from the fixed-step game; no physics runs behind it.
(() => {
  'use strict';
  const q=s=>document.querySelector(s),stage=q('#introStage'),surface=q('#introCanvas'),g=surface.getContext('2d'),overlay=q('#dudeIntro'),app=q('.app'),music=q('#introAudio');
  const lines=["Man... this mansion thing is getting old.","Too many rooms. Too much silence. Too much nonsense.","I miss simple things.","A ball. A lane. A few friends.","Now that’s a proper evening.","I’m done with this place.","I’m gonna find the exit...","...and go bowling.","Okay... where the hell is the exit?","Let’s get this over with."];
  const durations=[3400,4300,2600,3200,3000,2900,3100,2600,3700,3200];
  const bubble={x:750,y:55,w:575,h:190,padX:36,padY:22};
  let phase='title',index=0,elapsed=0,last=0,dirty=true,wantedMusic=true,audioVersion=0,generation=0,wasPlaying=false,layout=null;
  const pictures={};
  music.src=q('#roomMusic').getAttribute('src');music.volume=.24;
  function img(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('Intro image could not load'));i.src=src})}
  const imagesReady=Promise.all(['title','story'].map(async k=>pictures[k]=await img(INTRO_MEDIA[k]))).then(()=>{dirty=true;render()}).catch(()=>{q('#introNotice').textContent='Could not load the image. Please reopen the file.'});
  const dots=lines.map(()=>{const dot=document.createElement('i');q('#introProgress').appendChild(dot);return dot});
  function musicLabel(){q('#introMusic').textContent=wantedMusic&&!music.paused?'♫ MUSIC ON':'♫ MUSIC OFF'}
  function stopMusic(reset=false){audioVersion++;music.pause();if(reset)music.currentTime=0;musicLabel()}
  async function playMusic(){if(!wantedMusic||document.hidden)return;const token=++audioVersion;music.volume=.24;try{await music.play();if(token!==audioVersion)return;musicLabel()}catch{if(token===audioVersion){wantedMusic=false;musicLabel();q('#introNotice').textContent='Use the MUSIC button to start the soundtrack.'}}}
  function toggleMusic(){wantedMusic=!wantedMusic;q('#introNotice').textContent='';if(wantedMusic)playMusic();else stopMusic()}
  function wrap(text,width){let line='',out=[];for(const word of text.split(/\s+/)){const s=line?line+' '+word:word;if(g.measureText(s).width<=width){line=s;continue}if(line)out.push(line);line='';for(const c of word){if(line&&g.measureText(line+c).width>width){out.push(line);line=''}line+=c}}if(line)out.push(line);return out}
  function fit(text){const b=bubble,maxW=b.w-b.padX*2,maxH=b.h-b.padY*2;let low=16,high=62;
    for(let n=0;n<12;n++){const f=(low+high)/2;g.font=`800 ${f}px Arial`;const a=wrap(text,maxW);if(a.length*f*1.12<=maxH)low=f;else high=f}
    const font=Math.floor(low*4)/4;g.font=`800 ${font}px Arial`;return{...b,font,lines:wrap(text,maxW),lineHeight:font*1.12};
  }
  function drawBubble(text){const b=fit(text);layout=b;g.save();g.fillStyle='#fffdf0';g.strokeStyle='#11110f';g.lineWidth=5;g.lineJoin='round';
    // One joined outline: the short tail points beside his cheek, never across the face.
    g.beginPath();g.moveTo(788,55);g.lineTo(1287,55);g.quadraticCurveTo(1325,55,1325,93);g.lineTo(1325,207);g.quadraticCurveTo(1325,245,1287,245);g.lineTo(800,245);g.lineTo(532,202);g.lineTo(750,211);g.lineTo(750,93);g.quadraticCurveTo(750,55,788,55);g.closePath();g.shadowColor='#000a';g.shadowOffsetX=6;g.shadowOffsetY=8;g.fill();g.shadowColor='transparent';g.stroke();
    g.fillStyle='#10100f';g.font=`800 ${b.font}px Arial`;g.textAlign='center';g.textBaseline='middle';b.lines.forEach((s,i)=>g.fillText(s,b.x+b.w/2,b.y+b.h/2+(i-(b.lines.length-1)/2)*b.lineHeight));g.restore();
  }
  function resize(){const r=stage.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);surface.width=Math.max(1,Math.round(r.width*dpr));surface.height=Math.max(1,Math.round(r.height*dpr));dirty=true;render()}
  function render(){if(phase==='game')return;g.setTransform(surface.width/1536,0,0,surface.height/864,0,0);g.fillStyle='#080b10';g.fillRect(0,0,1536,864);const im=pictures[phase==='title'?'title':'story'];if(im)g.drawImage(im,0,0,1536,864);layout=null;if(phase==='story'||phase==='leaving')drawBubble(lines[index]);dirty=false}
  function showLine(){q('#introSpeech').textContent=lines[index];dots.forEach((d,i)=>{d.classList.toggle('done',i<index);d.classList.toggle('current',i===index)});q('#introProgress').setAttribute('aria-label',`Line ${index+1} of ${lines.length}`);elapsed=0;dirty=true;render()}
  function controls(story){q('#introSkip').textContent='SKIP INTRO';q('#introContinue').hidden=story||!window.DUDE_GAME.hasSave();q('#introStart').hidden=story;q('#introSkip').hidden=!story;q('#introMusic').hidden=!story;q('#introProgress').hidden=!story}
  function start(){if(phase!=='title')return;window.DUDE_BOOT.loadGame().catch(()=>{});generation++;phase='story';index=0;last=performance.now();controls(true);q('#introNotice').textContent='';music.currentTime=0;playMusic();showLine()}
  async function finish(skipped=false){if(phase!=='story')return;phase='leaving';const token=++generation;q('#introNotice').textContent=window.DUDE_BOOT.state().ready?'':'Loading game…';
    try{await window.DUDE_BOOT.loadGame();if(token!==generation)return;stopMusic(true);window.DUDE_INTRO_ACTIVE=false;document.body.classList.remove('intro-active');app.inert=false;overlay.hidden=true;phase='game';q('#introNotice').textContent='';window.DUDE_GAME.start();dispatchEvent(new CustomEvent('jetsetdude:introcomplete',{detail:{skipped,room:'bathroom'}}))}
    catch{if(token===generation){phase='load-error';q('#introSkip').textContent='RETRY';q('#introNotice').textContent='Could not load the game. Check your connection and tap RETRY.'}}
  }
  function next(){if(phase!=='story')return;if(index===lines.length-1){finish(false);return}index++;showLine()}
  function showTitle(){generation++;stopMusic(true);window.DUDE_GAME.pause();window.DUDE_INTRO_ACTIVE=true;app.inert=true;document.body.classList.add('intro-active');overlay.hidden=false;phase='title';index=0;elapsed=0;last=performance.now();controls(false);q('#introSpeech').textContent='';q('#introNotice').textContent='';resize()}
  function advance(ms){if(phase!=='story'||document.hidden)return;elapsed+=Math.max(0,ms);if(elapsed>=durations[index])next()}
  function frame(t){if(last&&phase==='story'&&!document.hidden)advance(Math.min(250,t-last));last=t;if(dirty)render();requestAnimationFrame(frame)}
  async function fullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen({navigationUI:'hide'});else await document.exitFullscreen()}catch{q('#introNotice').textContent='Fullscreen is not available in this browser.'}}
  q('#introContinue').onclick=async()=>{q('#introNotice').textContent='Loading saved game…';try{await window.DUDE_BOOT.loadGame()}catch{q('#introNotice').textContent='Could not load the game. Check your connection and try again.';return;}generation++;stopMusic(true);window.DUDE_INTRO_ACTIVE=false;document.body.classList.remove('intro-active');app.inert=false;overlay.hidden=true;phase='game';q('#introNotice').textContent='';window.DUDE_GAME.resume()};q('#introStart').onclick=start;q('#introSkip').onclick=()=>{if(phase==='load-error')phase='story';finish(true)};q('#introMusic').onclick=toggleMusic;q('#introFullscreen').onclick=fullscreen;
  surface.addEventListener('click',next);
  addEventListener('keydown',e=>{if(!window.DUDE_INTRO_ACTIVE||e.repeat||e.target?.tagName==='BUTTON')return;if(['Space','Enter','ArrowRight'].includes(e.code)){e.preventDefault();phase==='title'?start():next()}if(e.code==='KeyM'&&phase==='story')toggleMusic();if(e.code==='KeyF')fullscreen()});
  addEventListener('resize',resize);document.addEventListener('fullscreenchange',()=>{q('#introFullscreen').textContent='Fullscreen';resize()});
  document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden){wasPlaying=!music.paused;stopMusic()}else if(phase==='story'&&wantedMusic&&wasPlaying)playMusic()});
  window.JET_SET_DUDE_INTRO={start,next,skip:()=>finish(true),showTitle,advance,render,fit,lines:lines.slice(),durations:durations.slice(),ready:imagesReady,state:()=>({phase,index,elapsed,musicPlaying:!music.paused}),layout:()=>layout};
  controls(false);app.inert=true;resize();requestAnimationFrame(frame);
})();
