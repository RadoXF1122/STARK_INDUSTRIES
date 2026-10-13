// STARK INDUSTRIES - natywna aplikacja (Capacitor). Okulary tylko przez Bluetooth BLE "STARK_EDITH_V1".
const AI_URL="https://project--de4c3ed0-753f-43b7-a1c5-8d8c4665c5c8.lovable.app/api/public/edith";
const NAME="STARK_EDITH_V1",SVC="5a4e0001-7374-6172-6b2d-656469746831",CMD="5a4e0002-7374-6172-6b2d-656469746831",DATA="5a4e0003-7374-6172-6b2d-656469746831",INFO="5a4e0004-7374-6172-6b2d-656469746831";
const P=(window.Capacitor&&Capacitor.Plugins)||{};const BLE=P.BluetoothLe,TTS=P.TextToSpeech,SR=P.SpeechRecognition;
const $=id=>document.getElementById(id);let dev=null,msgs=[],busy=false,chunks=[],photoWait=null;
const hex2b=h=>{h=h.replace(/\s/g,'');const a=new Uint8Array(h.length/2);for(let i=0;i<a.length;i++)a[i]=parseInt(h.substr(i*2,2),16);return a};
const b2hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const ascii=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/Ł/g,'L').replace(/[^\x20-\x7E|]/g,'');
function screen(t){$('screen').textContent=t}
function setBt(on){$('bt').textContent=on?'● POŁĄCZONE':'○ BRAK';$('bt').className=on?'ok':'dim';$('pair').style.display=on?'none':'block'}
function log(role,text,img){msgs.push({role,text,...(img?{image:img}:{})});const d=document.createElement('div');d.className='m'+(role==='user'?' u':'');d.innerHTML='<em>'+(role==='user'?'TY':'E.D.I.T.H.')+(img?' · 📷':'')+'</em>';d.append(text);$('log').append(d);$('log').scrollTop=1e9}
async function send(p){if(!dev)return;try{await BLE.write({deviceId:dev,service:SVC,characteristic:CMD,value:b2hex(new TextEncoder().encode(ascii(p).slice(0,180)))})}catch(e){}}
async function attach(id){dev=id;screen('ŁĄCZENIE Z OKULARAMI…');
  await BLE.connect({deviceId:id,timeout:15000});
  BLE.addListener(`disconnected|${id}`,()=>{setBt(false);screen('OKULARY ROZŁĄCZONE — ŁĄCZĘ…');setTimeout(()=>attach(id).catch(()=>screen('BRAK OKULARÓW')),2500)});
  BLE.addListener(`notification|${id}|${SVC}|${DATA}`,r=>chunks.push(hex2b(r.value)));
  BLE.addListener(`notification|${id}|${SVC}|${INFO}`,r=>{const t=new TextDecoder().decode(hex2b(r.value));if(t.startsWith('LEN:'))chunks=[];if(t==='END'&&photoWait){photoWait(new Blob(chunks,{type:'image/jpeg'}));photoWait=null}});
  await BLE.startNotifications({deviceId:id,service:SVC,characteristic:DATA});
  await BLE.startNotifications({deviceId:id,service:SVC,characteristic:INFO});
  localStorage.setItem('edith-dev',id);setBt(true);screen('OKULARY POŁĄCZONE');}
async function autoConnect(){if(!BLE)return screen('BRAK BLUETOOTH (uruchom jako aplikacje)');await BLE.initialize({androidNeverForLocation:true});
  const saved=localStorage.getItem('edith-dev');
  try{if(saved)return await attach(saved)}catch(e){}
  try{let found=false;await BLE.requestLEScan({name:NAME},async r=>{if(found)return;found=true;await BLE.stopLEScan();attach(r.device.deviceId).catch(()=>{})});setTimeout(()=>BLE.stopLEScan().catch(()=>{}),20000)}catch(e){}}
$('pair').onclick=async()=>{try{await BLE.initialize({androidNeverForLocation:true});const d=await BLE.requestDevice({name:NAME,services:[SVC]});await attach(d.deviceId)}catch(e){screen('NIE ZNALEZIONO '+NAME)}};
async function photo(){if(!dev)return;const p=new Promise(r=>{photoWait=r;setTimeout(()=>{if(photoWait){photoWait=null;r(null)}},15000)});await send('P');const b=await p;if(!b||b.size<200)return;return await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)})}
async function speak(t){try{await TTS.speak({text:t,lang:'pl-PL',rate:1.0,category:'playback'})}catch(e){}}
const strip=t=>t.replace(/^\s*(e\.?\s*d\.?\s*i\.?\s*t\.?\s*h\.?|edith|edyta|edit)[\s,.:!]*/i,'').trim();
function shutdown(){msgs=[];$('log').innerHTML='';send('C');try{TTS.stop()}catch(e){}screen('SYSTEM OFFLINE — PAMIĘĆ WYCZYSZCZONA')}
async function handle(raw){const text=strip(raw);if(!text||busy)return;const low=text.toLowerCase();
  if(low.includes('wyłącz system'))return shutdown();
  if(/protok[oó]ł\s*r\.?\s*a/.test(low)){send('R');screen('PROTOKÓŁ R.A.');window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ','_system');return}
  if(low.includes('wyłącz protokół')){send('C');screen('CZUWANIE');return}
  busy=true;$('core').classList.add('on');screen('KAMERA OKULARÓW…');const img=await photo();log('user',text,img);screen('PROCESSING…');send('T:PROCESSING...');
  try{const r=await fetch(AI_URL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:msgs.map((m,i)=>i===msgs.length-1?m:{role:m.role,text:m.text})})});const j=await r.json();log('assistant',j.text);screen(j.text);send('T:'+j.text);speak(j.text)}
  catch(e){log('assistant','Błąd połączenia z AI. Sprawdź internet.');screen('BŁĄD')}
  busy=false;$('core').classList.remove('on')}
$('f').onsubmit=e=>{e.preventDefault();const t=$('in').value;$('in').value='';handle(t)};
$('off').onclick=shutdown;
$('mic').onclick=async()=>{if(!SR)return screen('BRAK ROZPOZNAWANIA MOWY');try{await SR.requestPermissions();$('mic').classList.add('on');screen('SŁUCHAM…');const r=await SR.start({language:'pl-PL',maxResults:1,popup:false,partialResults:false});$('mic').classList.remove('on');if(r&&r.matches&&r.matches[0])handle(r.matches[0])}catch(e){$('mic').classList.remove('on');screen('NIE USŁYSZAŁEM')}};
document.addEventListener('DOMContentLoaded',()=>{});autoConnect();
