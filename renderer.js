const drop=document.getElementById('drop'), fileName=document.getElementById('fileName'), filePath=document.getElementById('filePath');
const scanBtn=document.getElementById('scan'), cleanBtn=document.getElementById('clean'), showBtn=document.getElementById('show');
const status=document.getElementById('status'), log=document.getElementById('log'); let selected=null, cleaned=null;
function setStatus(text,type='info'){status.textContent=text;status.className=`status ${type}`}
function setFile(file){selected=file;cleaned=null;showBtn.hidden=true;fileName.textContent=file.split(/[\\/]/).pop();filePath.textContent=file;scanBtn.disabled=cleanBtn.disabled=false;setStatus('Ready. Scan the source or create the clean copy.','info');log.textContent=''}
async function choose(){const file=await window.videoCleaner.choose();if(file)setFile(file)}
drop.addEventListener('click',choose);drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose()}});
for(const name of ['dragenter','dragover'])drop.addEventListener(name,e=>{e.preventDefault();drop.classList.add('over')});
for(const name of ['dragleave','drop'])drop.addEventListener(name,e=>{e.preventDefault();drop.classList.remove('over')});
drop.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f&&/\.(mp4|mov|m4v)$/i.test(f.name))setFile(f.path);else setStatus('Choose an MP4, MOV or M4V file.','error')});
scanBtn.addEventListener('click',async()=>{try{scanBtn.disabled=true;setStatus('Scanning the file for C2PA/JUMBF text markers…');const r=await window.videoCleaner.scan(selected);setStatus(r.hits.length?`Potential Content Credential markers found: ${r.hits.join(', ')}.\nThis is a presence check, not full cryptographic validation.`:'No C2PA/JUMBF text markers were found.',''+(r.hits.length?'warn':'ok'))}catch(e){setStatus(e.message,'error')}finally{scanBtn.disabled=false}});
cleanBtn.addEventListener('click',async()=>{try{scanBtn.disabled=cleanBtn.disabled=true;log.textContent='';setStatus('Remuxing locally. The video and audio are being copied without re-encoding…');const r=await window.videoCleaner.clean(selected);cleaned=r.output;showBtn.hidden=false;setStatus(r.hits.length?`Clean copy created, but potential markers remain: ${r.hits.join(', ')}.\nDo not upload yet. Check the file in Premiere Pro.`:`Clean copy created:\n${r.output}\n\nNo C2PA/JUMBF text markers were found in the output. Confirm with Premiere Pro before uploading.` ,r.hits.length?'warn':'ok')}catch(e){setStatus(e.message,'error')}finally{scanBtn.disabled=cleanBtn.disabled=false}});
showBtn.addEventListener('click',()=>window.videoCleaner.show(cleaned));
window.videoCleaner.onLog(text=>{log.textContent+=text;log.scrollTop=log.scrollHeight});
