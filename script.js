// Constants
const MONTHLY_TARGET = 200;

// State
let currentSession = null;
let sessions = [];

// DOM Elements
const tapInBtn = document.getElementById('tap-in-btn');
const tapOutBtn = document.getElementById('tap-out-btn');
const statusEl = document.getElementById('status');
const currentSessionEl = document.getElementById('current-session');
const todayHoursEl = document.getElementById('today-hours');
const monthHoursEl = document.getElementById('month-hours');
const remainingHoursEl = document.getElementById('remaining-hours');
const progressPercentEl = document.getElementById('progress-percent');
const progressFillEl = document.getElementById('progress-fill');
const historyListEl = document.getElementById('history-list');
const clearDataBtn = document.getElementById('clear-data-btn');
const exportBtn = document.getElementById('export-btn');
const statusCard = document.querySelector('.status-card');

/* NEW DOM */

const manualBtn = document.getElementById('manual-entry-btn');
const manualCard = document.getElementById('manual-entry-card');
const manualSave = document.getElementById('manual-save');
const manualCancel = document.getElementById('manual-cancel');
const manualDate = document.getElementById('manual-date');
const manualStart = document.getElementById('manual-start');
const manualEnd = document.getElementById('manual-end');


// Load data
function loadData() {
const savedSessions = localStorage.getItem('attendanceSessions');
const savedCurrentSession = localStorage.getItem('currentSession');

if (savedSessions) sessions = JSON.parse(savedSessions);
if (savedCurrentSession) currentSession = JSON.parse(savedCurrentSession);
}

// Save data
function saveData() {
localStorage.setItem('attendanceSessions', JSON.stringify(sessions));

if (currentSession)
localStorage.setItem('currentSession', JSON.stringify(currentSession));
else
localStorage.removeItem('currentSession');
}


// Format date
function formatDate(date) {
return new Date(date).toLocaleDateString('en-US',{
month:'short',
day:'numeric',
year:'numeric'
});
}


// Format time
function formatTime(date) {
return new Date(date).toLocaleTimeString('en-US',{
hour:'2-digit',
minute:'2-digit'
});
}


// Duration
function calculateDuration(start,end) {
return (new Date(end) - new Date(start))/(1000*60*60);
}


// Format hours
function formatHours(hours){
const h=Math.floor(hours);
const m=Math.round((hours-h)*60);

if(h===0) return `${m}m`;
if(m===0) return `${h}h`;

return `${h}h ${m}m`;
}


// Filters

function getTodaySessions(){
const today=new Date().toDateString();
return sessions.filter(s=>new Date(s.tapIn).toDateString()===today);
}

function getMonthSessions(){
const now=new Date();
return sessions.filter(s=>{
const d=new Date(s.tapIn);
return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
});
}

function calculateTotalHours(list){
return list.reduce((total,s)=> total + calculateDuration(s.tapIn,s.tapOut),0);
}


// Update UI

function updateUI(){

if(currentSession){

statusEl.textContent='✅ Tapped In';
statusCard.classList.add('tapped-in');

const duration=calculateDuration(currentSession.tapIn,new Date());

currentSessionEl.textContent=`Since ${formatTime(currentSession.tapIn)} (${formatHours(duration)})`;

tapInBtn.disabled=true;
tapOutBtn.disabled=false;

}
else{

statusEl.textContent='⭕ Not Tapped In';
statusCard.classList.remove('tapped-in');
currentSessionEl.textContent='';

tapInBtn.disabled=false;
tapOutBtn.disabled=true;

}

const todaySessions=getTodaySessions();
const monthSessions=getMonthSessions();

let todayHours=calculateTotalHours(todaySessions);
let monthHours=calculateTotalHours(monthSessions);

if(currentSession){
const duration=calculateDuration(currentSession.tapIn,new Date());
todayHours+=duration;
monthHours+=duration;
}

const remaining=Math.max(0,MONTHLY_TARGET-monthHours);
const progress=Math.min(100,(monthHours/MONTHLY_TARGET)*100);

todayHoursEl.textContent=formatHours(todayHours);
monthHoursEl.textContent=formatHours(monthHours);
remainingHoursEl.textContent=formatHours(remaining);

progressPercentEl.textContent=`${progress.toFixed(0)}%`;
progressFillEl.style.width=`${progress}%`;

renderHistory();

}


// Render history

function renderHistory(){

if(sessions.length===0){
historyListEl.innerHTML='<p style="text-align:center;color:#9ca3af;padding:20px;">No sessions yet</p>';
return;
}

const sorted=[...sessions].sort((a,b)=> new Date(b.tapIn)-new Date(a.tapIn));
const recent=sorted.slice(0,20);

historyListEl.innerHTML=recent.map(session=>{

const duration=calculateDuration(session.tapIn,session.tapOut);

return `

<div class="history-item">
<div>
<div class="history-date">${formatDate(session.tapIn)}</div>
<div class="history-time">${formatTime(session.tapIn)} - ${formatTime(session.tapOut)}</div>
</div>
<div class="history-duration">${formatHours(duration)}</div>
</div>

`;

}).join('');

}


// Tap In

function tapIn(){
currentSession={ tapIn:new Date().toISOString() };
saveData();
updateUI();
}


// Tap Out

function tapOut(){

if(!currentSession) return;

sessions.push({
tapIn:currentSession.tapIn,
tapOut:new Date().toISOString()
});

currentSession=null;

saveData();
updateUI();

}


// MANUAL ENTRY

manualBtn.addEventListener('click',()=>{

manualCard.classList.remove('hidden');

const today=new Date().toISOString().split("T")[0];
manualDate.value=today;

});


manualCancel.addEventListener('click',()=>{

manualCard.classList.add('hidden');

});


manualSave.addEventListener('click',()=>{

const date=manualDate.value;
const start=manualStart.value;
const end=manualEnd.value;

if(!date || !start || !end){
alert("Please fill all fields");
return;
}

const tapIn=new Date(`${date}T${start}`);
const tapOut=new Date(`${date}T${end}`);

if(tapOut<=tapIn){
alert("End time must be after start time");
return;
}

sessions.push({
tapIn:tapIn.toISOString(),
tapOut:tapOut.toISOString()
});

saveData();
updateUI();

manualCard.classList.add('hidden');

});


// Export

function exportData(){

const data={sessions:sessions};

const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});

const url=URL.createObjectURL(blob);

const a=document.createElement('a');

a.href=url;

a.download=`attendance-data-${new Date().toISOString().split('T')[0]}.json`;

a.click();

URL.revokeObjectURL(url);

}


// Clear

function clearData(){

if(confirm('Are you sure you want to clear all attendance data? This cannot be undone!')){

sessions=[];
currentSession=null;

localStorage.clear();

updateUI();

}

}


// Events

tapInBtn.addEventListener('click',tapIn);
tapOutBtn.addEventListener('click',tapOut);
clearDataBtn.addEventListener('click',clearData);
exportBtn.addEventListener('click',exportData);

setInterval(()=>{

if(currentSession) updateUI();

},1000);


loadData();
updateUI();