// 1) Crie um projeto gratuito em https://supabase.com
// 2) Copie Project URL e anon/public key em Settings > API
// 3) Cole os dois valores abaixo e execute schema.sql no SQL Editor.
const SUPABASE_URL = "https://ipycikzhjcnkvhnzvtac.supabase.co";
const SUPABASE_ANON_KEY = "https://ipycikzhjcnkvhnzvtac.supabase.co";
const BUCKET = "chat-media";

const $ = (id) => document.getElementById(id);
const clientReady = SUPABASE_URL.startsWith("https://") && !SUPABASE_ANON_KEY.startsWith("COLE_");
let db = null, roomId = new URLSearchParams(location.search).get("sala"), nickname = "";
let channel = null, recorder = null, audioChunks = [], isRecording = false;

function makeRoomId(){ return crypto.randomUUID(); }
function showEntryError(msg){ $("entryError").textContent = msg; }
function escapeHtml(value){ return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function timeLabel(value){ return new Date(value).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}); }

async function startChat(){
  if(!clientReady){ showEntryError("Antes de usar, configure a URL e a chave do Supabase no arquivo app.js."); return; }
  nickname = $("nickname").value.trim();
  if(!nickname){ showEntryError("Digite seu nome para entrar."); return; }
  if(!roomId){ roomId = makeRoomId(); history.replaceState({}, "", "?sala="+encodeURIComponent(roomId)); }
  db = window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
  $("entry").classList.add("hidden"); $("chat").classList.remove("hidden");
  $("roomStatus").textContent = "sala compartilhada";
  await loadMessages();
  subscribeMessages();
}
async function loadMessages(){
  const {data,error}=await db.from("messages").select("*").eq("room_id",roomId).order("created_at",{ascending:true}).limit(150);
  if(error){ $("roomStatus").textContent="erro ao carregar"; console.error(error); return; }
  $("messages").innerHTML="";
  (data||[]).forEach(renderMessage);
  scrollBottom();
}
function subscribeMessages(){
  channel=db.channel("room-"+roomId).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:"room_id=eq."+roomId},payload=>{
    renderMessage(payload.new); scrollBottom();
  }).subscribe(status=>{ if(status==="SUBSCRIBED") $("roomStatus").textContent="online"; });
}
function renderMessage(m){
  if($("messages").querySelector('[data-id="'+m.id+'"]')) return;
  const mine=m.sender===nickname;
  const el=document.createElement("article"); el.className="bubble"+(mine?" mine":""); el.dataset.id=m.id;
  let content="";
  if(m.type==="image" && m.media_url) content='<img src="'+escapeHtml(m.media_url)+'" alt="Imagem compartilhada" loading="lazy">';
  else if(m.type==="audio" && m.media_url) content='<audio controls preload="metadata" src="'+escapeHtml(m.media_url)+'"></audio>';
  else content='<div class="body-text">'+escapeHtml(m.content||"")+'</div>';
  el.innerHTML='<div class="sender">'+escapeHtml(m.sender)+'</div>'+content+'<div class="time">'+timeLabel(m.created_at)+'</div>';
  $("messages").appendChild(el);
}
function scrollBottom(){ $("messages").scrollTop=$("messages").scrollHeight; }
async function sendText(){
  const content=$("messageInput").value.trim(); if(!content) return;
  $("sendBtn").disabled=true;
  const {error}=await db.from("messages").insert({room_id:roomId,sender:nickname,type:"text",content});
  $("sendBtn").disabled=false;
  if(error) alert("Não foi possível enviar. Confira a configuração do Supabase.");
  else $("messageInput").value="";
}
async function uploadMedia(file,type){
  if(!file) return;
  if(file.size>15*1024*1024){ alert("Escolha um arquivo de até 15 MB."); return; }
  const ext=(file.name.split(".").pop()|| (type==="audio"?"webm":"jpg")).replace(/[^a-z0-9]/gi,"").toLowerCase();
  const path=roomId+"/"+crypto.randomUUID()+"."+ext;
  const {error:upErr}=await db.storage.from(BUCKET).upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});
  if(upErr){ alert("Falha ao enviar arquivo. Confira o bucket e as permissões."); console.error(upErr); return; }
  const {data}=db.storage.from(BUCKET).getPublicUrl(path);
  const {error}=await db.from("messages").insert({room_id:roomId,sender:nickname,type,media_url:data.publicUrl,content:""});
  if(error) alert("Arquivo enviado, mas não foi possível publicar a mensagem.");
}
async function toggleRecording(){
  if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){ alert("Seu navegador não permite gravar áudio. Tente usar Chrome ou Safari atualizado."); return; }
  if(!isRecording){
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      recorder=new MediaRecorder(stream); audioChunks=[];
      recorder.ondataavailable=e=>{if(e.data.size) audioChunks.push(e.data);};
      recorder.onstop=async()=>{const blob=new Blob(audioChunks,{type:recorder.mimeType||"audio/webm"});stream.getTracks().forEach(t=>t.stop());if(blob.size) await uploadMedia(new File([blob],"mensagem.webm",{type:blob.type}),"audio");$("recordHint").textContent="";};
      recorder.start();isRecording=true;$("recordBtn").classList.add("recording");$("recordBtn").textContent="■";$("recordHint").textContent="Gravando... toque no quadrado para enviar.";
    }catch(e){alert("Permita o acesso ao microfone para gravar.");}
  }else{recorder.stop();isRecording=false;$("recordBtn").classList.remove("recording");$("recordBtn").textContent="🎙";}
}
$("enterBtn").addEventListener("click",startChat);
$("createBtn").addEventListener("click",()=>{roomId=makeRoomId();history.replaceState({}, "", "?sala="+encodeURIComponent(roomId));startChat();});
$("sendBtn").addEventListener("click",sendText);
$("messageInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendText();}});
$("photoInput").addEventListener("change",e=>{const f=e.target.files[0];if(f)uploadMedia(f,"image");e.target.value="";});
$("recordBtn").addEventListener("click",toggleRecording);
$("shareBtn").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(location.href);$("shareBtn").textContent="✓";setTimeout(()=>$("shareBtn").textContent="↗",1500);}catch(e){prompt("Copie o link da sala:",location.href);}});
if(roomId) $("entry").querySelector("p").textContent="Você recebeu um convite para uma sala. Digite seu nome para entrar.";
