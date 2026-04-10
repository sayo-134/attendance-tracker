// Constants
const MONTHLY_TARGET = 200;

let currentSession = null;
let sessions = [];

let viewMode = "daily_inside";


// ================= DOM =================

const tapInBtn = document.getElementById('tap-in-btn');
const tapOutBtn = document.getElementById('tap-out-btn');

const weeklyInsideBtn = document.getElementById('weekly-inside-btn');
const weeklyOutsideBtn = document.getElementById('weekly-outside-btn');
const dailyInsideBtn = document.getElementById('daily-inside-btn');
const dailyOutsideBtn = document.getElementById('daily-outside-btn');

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


// ================= MANUAL =================

const manualBtn = document.getElementById('manual-entry-btn');
const manualCard = document.getElementById('manual-entry-card');

const manualSave = document.getElementById('manual-save');
const manualCancel = document.getElementById('manual-cancel');

const manualDate = document.getElementById('manual-date');
const manualStart = document.getElementById('manual-start');
const manualEnd = document.getElementById('manual-end');
const manualType = document.getElementById('manual-type');


// ================= LOAD =================

function loadData(){

    const savedSessions = localStorage.getItem('attendanceSessions');
    const savedCurrentSession = localStorage.getItem('currentSession');

    if(savedSessions){
        sessions = JSON.parse(savedSessions);

        sessions = sessions.map(s => ({
            ...s,
            type: s.type || "inside"
        }));
    }

    if(savedCurrentSession){
        currentSession = JSON.parse(savedCurrentSession);
    }
}


// ================= SAVE =================

function saveData(){
    localStorage.setItem('attendanceSessions', JSON.stringify(sessions));

    if(currentSession){
        localStorage.setItem('currentSession', JSON.stringify(currentSession));
    } else {
        localStorage.removeItem('currentSession');
    }
}


// ================= HELPERS =================

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


// ================= UPDATE UI =================

function updateUI(){

    if(currentSession){
        statusEl.textContent='✅ Tapped In';
        statusCard.classList.add('tapped-in');

        const duration=calculateDuration(currentSession.tapIn,new Date());
        currentSessionEl.textContent=`Since ${formatHours(duration)}`;

        tapInBtn.disabled=true;
        tapOutBtn.disabled=false;

    } else {
        statusEl.textContent='⭕ Not Tapped In';
        statusCard.classList.remove('tapped-in');

        currentSessionEl.textContent='';
        tapInBtn.disabled=false;
        tapOutBtn.disabled=true;
    }


    const now = new Date();

    // ================= TODAY HOURS (FIX) =================
    let todayHours = sessions
        .filter(s => {
            const d = new Date(s.tapIn);
            return d.toDateString() === now.toDateString();
        })
        .reduce((t,s)=>t+calculateDuration(s.tapIn,s.tapOut),0);

    // include ongoing session
    if(currentSession){
        const d = new Date(currentSession.tapIn);
        if(d.toDateString() === now.toDateString()){
            todayHours += calculateDuration(currentSession.tapIn, new Date());
        }
    }


    // ================= MONTH HOURS =================
    let monthHours = sessions
        .filter(s => {
            const d = new Date(s.tapIn);
            return d.getMonth() === now.getMonth() &&
                   d.getFullYear() === now.getFullYear();
        })
        .reduce((t,s)=>t+calculateDuration(s.tapIn,s.tapOut),0);


    const remaining=Math.max(0,MONTHLY_TARGET-monthHours);
    const progress=Math.min(100,(monthHours/MONTHLY_TARGET)*100);


    // ================= UPDATE UI =================
    todayHoursEl.textContent = formatHours(todayHours);
    monthHoursEl.textContent = formatHours(monthHours);
    remainingHoursEl.textContent = formatHours(remaining);

    progressPercentEl.textContent=`${progress.toFixed(0)}%`;
    progressFillEl.style.width=`${progress}%`;

    renderHistory();
}


// ================= VIEW =================

function setView(mode){

    viewMode = mode;

    document.querySelectorAll('.btn-view')
    .forEach(btn => btn.classList.remove('active-view'));

    if(mode==="weekly_inside" && weeklyInsideBtn) weeklyInsideBtn.classList.add('active-view');
    if(mode==="weekly_outside" && weeklyOutsideBtn) weeklyOutsideBtn.classList.add('active-view');
    if(mode==="daily_inside" && dailyInsideBtn) dailyInsideBtn.classList.add('active-view');
    if(mode==="daily_outside" && dailyOutsideBtn) dailyOutsideBtn.classList.add('active-view');

    renderHistory();
}


// ================= HISTORY =================

function renderHistory(){

    if(sessions.length===0){
        historyListEl.innerHTML='<p style="text-align:center;">No sessions</p>';
        return;
    }

    const type = viewMode.includes("outside") ? "outside" : "inside";
    const filtered = sessions.filter(s => (s.type||"inside")===type);


    // DAILY
    if(viewMode.includes("daily")){

        const daily={};

        filtered.forEach(s=>{
            const key=new Date(s.tapIn).toDateString();
            const d=calculateDuration(s.tapIn,s.tapOut);

            if(!daily[key]) daily[key]=0;
            daily[key]+=d;
        });

        const sorted=Object.entries(daily)
        .sort((a,b)=>new Date(b[0])-new Date(a[0]));

        historyListEl.innerHTML=sorted.map(([d,total])=>`
        <div class="history-item ${type}">
            <div class="history-date">${d}</div>
            <div class="history-duration">${formatHours(total)}</div>
        </div>
        `).join('');
    }

    // WEEKLY
    else{

        const weekly={};

        filtered.forEach(s=>{
            const d=new Date(s.tapIn);

            const start=new Date(d);
            start.setDate(d.getDate()-d.getDay());
            start.setHours(0,0,0,0);

            const key=start.toISOString();

            const dur=calculateDuration(s.tapIn,s.tapOut);

            if(!weekly[key]) weekly[key]=0;
            weekly[key]+=dur;
        });

        const sorted=Object.entries(weekly)
        .sort((a,b)=>new Date(b[0])-new Date(a[0]));

        historyListEl.innerHTML=sorted.map(([k,total])=>{
            const start=new Date(k);
            const end=new Date(start);
            end.setDate(start.getDate()+6);

            return `
            <div class="history-item ${type}">
                <div class="history-date">
                ${formatDate(start)} - ${formatDate(end)}
                </div>
                <div class="history-duration">${formatHours(total)}</div>
            </div>
            `;
        }).join('');
    }
}


// ================= TAP =================

function tapIn(){
    currentSession={tapIn:new Date().toISOString(),type:"inside"};
    saveData(); updateUI();
}

function tapOut(){
    if(!currentSession) return;

    sessions.push({
        tapIn:currentSession.tapIn,
        tapOut:new Date().toISOString(),
        type:currentSession.type||"inside"
    });

    currentSession=null;
    saveData(); updateUI();
}


// ================= MANUAL =================

if(manualBtn){
manualBtn.addEventListener('click',()=>{
    manualCard.classList.remove('hidden');

    manualDate.value=new Date().toISOString().split("T")[0];
});
}

if(manualCancel){
manualCancel.addEventListener('click',()=>{
    manualCard.classList.add('hidden');
});
}

if(manualSave){
manualSave.addEventListener('click',()=>{

    const tapIn=new Date(`${manualDate.value}T${manualStart.value}`);
    const tapOut=new Date(`${manualDate.value}T${manualEnd.value}`);

    sessions.push({
        tapIn:tapIn.toISOString(),
        tapOut:tapOut.toISOString(),
        type:manualType.value
    });

    saveData();
    updateUI();

    manualCard.classList.add('hidden');
});
}


// ================= EXPORT =================

if(exportBtn){
exportBtn.addEventListener('click',()=>{

    if(sessions.length===0){
        alert("No data to export");
        return;
    }

    let csv="Date,Start,End,Duration,Type\n";

    sessions.forEach(s=>{
        csv+=`${s.tapIn.split("T")[0]},${s.tapIn},${s.tapOut},${calculateDuration(s.tapIn,s.tapOut).toFixed(2)},${s.type}\n`;
    });

    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);

    const a=document.createElement("a");
    a.href=url;
    a.download="attendance.csv";
    a.click();

    URL.revokeObjectURL(url);
});
}


// ================= CLEAR =================

if(clearDataBtn){
clearDataBtn.addEventListener('click',()=>{

    if(confirm("Are you sure you want to delete all data?")){
        sessions=[];
        currentSession=null;

        localStorage.removeItem('attendanceSessions');
        localStorage.removeItem('currentSession');

        updateUI();
    }
});
}


// ================= EVENTS (SAFE) =================

if(tapInBtn) tapInBtn.addEventListener('click',tapIn);
if(tapOutBtn) tapOutBtn.addEventListener('click',tapOut);

if(weeklyInsideBtn)
weeklyInsideBtn.addEventListener('click',()=>setView("weekly_inside"));

if(weeklyOutsideBtn)
weeklyOutsideBtn.addEventListener('click',()=>setView("weekly_outside"));

if(dailyInsideBtn)
dailyInsideBtn.addEventListener('click',()=>setView("daily_inside"));

if(dailyOutsideBtn)
dailyOutsideBtn.addEventListener('click',()=>setView("daily_outside"));


// ================= INIT =================

loadData();
updateUI();