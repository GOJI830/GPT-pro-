const $ = s => document.querySelector(s);
const chat = $("#chat"), messagesEl = $("#messages"), promptEl = $("#prompt");
let messages = JSON.parse(localStorage.getItem("gptpro-history") || "[]");
let selectedImage = null, busy = false;

function save(){ localStorage.setItem("gptpro-history", JSON.stringify(messages.slice(-40))); }
function render(){
  $("#welcome").style.display = messages.length ? "none" : "block";
  messagesEl.innerHTML = "";
  for(const m of messages){
    const row = document.createElement("div"); row.className = `message ${m.role}`;
    const avatar = document.createElement("div"); avatar.className="avatar"; avatar.textContent=m.role==="assistant"?"✦":"Я";
    const bubble = document.createElement("div"); bubble.className="bubble"; bubble.textContent=m.content;
    row.append(avatar,bubble); messagesEl.append(row);
  }
  chat.scrollTop=chat.scrollHeight;
}
function setBusy(v){busy=v;$("#sendBtn").disabled=v;$("#prompt").disabled=v;}
async function send(text){
  text=(text ?? promptEl.value).trim(); if(!text && !selectedImage || busy) return;
  const image=selectedImage; selectedImage=null; $("#imagePreview").style.display="none";
  messages.push({role:"user",content:text || "Опиши це зображення."}); save(); render(); promptEl.value=""; promptEl.style.height="auto"; setBusy(true);
  const typing=document.createElement("div");typing.className="typing";typing.textContent="GPT Pro думає…";messagesEl.append(typing);chat.scrollTop=chat.scrollHeight;
  try{
    const body={messages:messages.slice(-16)};
    if(image) body.image=image;
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const data=await r.json(); if(!r.ok) throw new Error(data.error || "Помилка сервера");
    messages.push({role:"assistant",content:data.reply}); save();
  }catch(e){messages.push({role:"assistant",content:"⚠️ "+e.message});save();}
  finally{setBusy(false);render();promptEl.focus();}
}
$("#composer").addEventListener("submit",e=>{e.preventDefault();send();});
promptEl.addEventListener("input",()=>{promptEl.style.height="auto";promptEl.style.height=Math.min(promptEl.scrollHeight,140)+"px";});
promptEl.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}});
$("#newChat").onclick=()=>{messages=[];save();render();$("#sidebar")?.classList.remove("open");};
$("#clearBtn").onclick=()=>{if(confirm("Очистити всю локальну історію?")){messages=[];save();render();}};
document.querySelectorAll(".suggestion").forEach(b=>b.onclick=()=>{promptEl.value=b.textContent.replace(/^\\S+\\s/,"");send();});
$("#attachBtn").onclick=()=>$("#imageInput").click();
$("#imageInput").onchange=async e=>{
  const file=e.target.files[0]; if(!file)return;
  if(file.size>4*1024*1024){alert("Зображення має бути меншим за 4 МБ.");return;}
  const reader=new FileReader();reader.onload=()=>{selectedImage=reader.result;$("#imagePreview").innerHTML=`<img src="${reader.result}" alt="Попередній перегляд"><button type="button" id="removeImage">×</button>`;$("#imagePreview").style.display="block";$("#removeImage").onclick=()=>{selectedImage=null;$("#imagePreview").style.display="none";};};reader.readAsDataURL(file);e.target.value="";
};
$("#micBtn").onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){alert("Голосове введення не підтримується цим браузером. Спробуй Chrome.");return;}
  const rec=new SR();rec.lang="uk-UA";rec.interimResults=false;rec.onresult=e=>{promptEl.value+=(promptEl.value?" ":"")+e.results[0][0].transcript;};rec.onerror=()=>alert("Не вдалося розпізнати голос.");rec.start();
};
$("#menuBtn").onclick=()=>$(".sidebar").classList.toggle("open");
(async()=>{try{const r=await fetch("/api/status");const d=await r.json();$("#statusText").textContent=d.configured?`Підключено · ${d.model}`:"Потрібне налаштування API";$(".status-dot").classList.toggle("ok",d.configured);}catch{$("#statusText").textContent="Сервер недоступний";}})();
render();
if("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});