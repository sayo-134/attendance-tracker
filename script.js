// Constants
const MONTHLY_TARGET = 200;

let currentSession = null;
let sessions = [];

let viewMode = "sessions";


// DOM

const tapInBtn = document.getElementById('tap-in-btn');
const tapOutBtn = document.getElementById('tap-out-btn');

const viewSessionsBtn = document.getElementById('view-sessions-btn');
const viewDailyBtn = document.getElementById('view-daily-btn');

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


// manual entry

const manualBtn = document.getElementById('manual-entry-btn');
const manualCard = document.getElementById('manual-entry-card');

const manualSave = document.getElementById('manual-save');
const manualCancel = document.getElementById('manual-cancel');

const manualDate = document.getElementById('manual-date');
const manualStart = document.getElementById('manual-start');
const manualEnd = document.getElementById('manual-end');


// load data

function loadData(){
const savedSessions = localStorage.getItem('attendanceSessions');
const savedCurrentSession = localStorage.getItem('currentSession');

if(savedSessions) sessions = JSON.parse(savedSessions);
if(savedCurrentSession) currentSession = JSON.parse(savedCurrentSession);
}


// save data

function saveData(){

localStorage.setItem('attendanceSessions',JSON.stringify(sessions));

if(currentSession)
localStorage.setItem('currentSession',JSON.stringify(currentSession));
else
localStorage.removeItem('currentSession');

}


// helpers

function calculateDuration(start,end){
return (new Date(end)-new Date(start))/(1000*60*60);
}

function formatHours(hours){
const h=Math.floor(hours);
const m=Math.round((hours-h)*60);

if(h===0) return `${m}m`;
if(m===0) return `${h}h`;

return `${h}h ${m}m`;
}

function formatDate(date){
return new Date(date).toLocaleDateString('en-US',{
month:'short',
day:'numeric',
year:'numeric'
});
}

function formatTime(date){
return new Date(date).toLocaleTimeString('en-US',{
hour:'2-digit',
minute:'2-digit'
});
}


// filters

function getTodaySessions(){
const today=new Date().toDateString();

return sessions.filter(s =>
new Date(s.tapIn).toDateString()===today
);
}

function getMonthSessions(){
const now=new Date();

return sessions.filter(s=>{
const d=new Date(s.tapIn);

return d.getMonth()===now.getMonth() &&
d.getFullYear()===now.getFullYear();
});
}

function calculateTotalHours(list){
return list.reduce((total,s)=>
total+calculateDuration(s.tapIn,s.tapOut),0);
}


// update UI

function updateUI(){

if(currentSession){

statusEl.textContent='✅ Tapped In';
statusCard.classList.add('tapped-in');

const duration=
calculateDuration(currentSession.tapIn,new Date());

currentSessionEl.textContent=
`Since ${formatHours(duration)}`;

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


let todayHours=calculateTotalHours(getTodaySessions());
let monthHours=calculateTotalHours(getMonthSessions());

if(currentSession){

const currentDuration=
calculateDuration(currentSession.tapIn,new Date());

todayHours+=currentDuration;
monthHours+=currentDuration;

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


// render history

function renderHistory(){

if(sessions.length===0){

historyListEl.innerHTML=
'<p style="text-align:center;color:#9ca3af;padding:20px;">No sessions yet</p>';

return;
}


// sessions view

if(viewMode==="sessions"){

const sorted=[...sessions].sort((a,b)=>
new Date(b.tapIn)-new Date(a.tapIn)
);

historyListEl.innerHTML=sorted.slice(0,20).map(s=>{

const duration=calculateDuration(s.tapIn,s.tapOut);

return`

<div class="history-item">

<div>
<div class="history-date">${formatDate(s.tapIn)}</div>
<div class="history-time">
${formatTime(s.tapIn)} - ${formatTime(s.tapOut)}
</div>
</div>

<div class="history-duration">${formatHours(duration)}</div>

</div>

`;

}).join('');
}


// weekly totals view

else{

const weeklyTotals = {};

sessions.forEach(s => {

const d = new Date(s.tapIn);

const startOfWeek = new Date(d);
startOfWeek.setDate(d.getDate() - d.getDay());
startOfWeek.setHours(0,0,0,0);

const key = startOfWeek.toISOString();

const duration = calculateDuration(s.tapIn, s.tapOut);

if(!weeklyTotals[key]) weeklyTotals[key] = 0;

weeklyTotals[key] += duration;

});

const sortedWeeks = Object.entries(weeklyTotals)
.sort((a,b)=> new Date(b[0]) - new Date(a[0]));

historyListEl.innerHTML = sortedWeeks.map(([weekStart,total]) => {

const start = new Date(weekStart);
const end = new Date(start);
end.setDate(start.getDate() + 6);

return `

<div class="history-item">

<div class="history-date">
${formatDate(start)} - ${formatDate(end)}
</div>

<div class="history-duration">
${formatHours(total)}
</div>

</div>

`;

}).join('');

}

}


// tap in/out

function tapIn(){
currentSession={tapIn:new Date().toISOString()};
saveData();
updateUI();
}

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


// view buttons

viewSessionsBtn.addEventListener('click',()=>{

viewMode="sessions";

viewSessionsBtn.classList.add('active-view');
viewDailyBtn.classList.remove('active-view');

renderHistory();

});

viewDailyBtn.addEventListener('click',()=>{

viewMode="weekly";

viewDailyBtn.classList.add('active-view');
viewSessionsBtn.classList.remove('active-view');

renderHistory();

});


// manual entry

manualBtn.addEventListener('click',()=>{

manualCard.classList.remove('hidden');

manualDate.value=new Date().toISOString().split("T")[0];
manualStart.value="";
manualEnd.value="";

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
alert("End must be after start");
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


// CSV export

function exportData(){

if(sessions.length === 0){
alert("No data to export");
return;
}

let csv = "Date,Start Time,End Time,Duration (hours)\n";

sessions.forEach(s => {

const start = new Date(s.tapIn);
const end = new Date(s.tapOut);

const date = start.toISOString().split("T")[0];
const startTime = formatTime(start);
const endTime = formatTime(end);

const duration = calculateDuration(s.tapIn, s.tapOut).toFixed(2);

csv += `${date},${startTime},${endTime},${duration}\n`;

});

const blob = new Blob([csv], { type: "text/csv" });

const url = URL.createObjectURL(blob);

const a = document.createElement("a");
a.href = url;
a.download = `attendance-${new Date().toISOString().split("T")[0]}.csv`;

a.click();

URL.revokeObjectURL(url);

}


// clear

function clearData(){

if(confirm('Are you sure?')){

sessions=[];
currentSession=null;

localStorage.clear();

updateUI();

}

}


// events

tapInBtn.addEventListener('click',tapIn);
tapOutBtn.addEventListener('click',tapOut);

clearDataBtn.addEventListener('click',clearData);
exportBtn.addEventListener('click',exportData);


setInterval(()=>{
if(currentSession) updateUI();
},1000);


loadData();
updateUI();