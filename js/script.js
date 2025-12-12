// global variables
let confessions = [];
let muted = false;
let whisperTimer = null;

// get all elements
const input = document.getElementById('input');
const submitBtn = document.getElementById('submitBtn');
const charInfo = document.getElementById('charInfo');
const recorded = document.getElementById('recorded');
const count = document.getElementById('count');
const historyList = document.getElementById('historyList');
const whisperBox = document.getElementById('whisperBox');
const whisperContent = document.getElementById('whisperContent');
const whisperDate = document.getElementById('whisperDate');
const glitchText = document.getElementById('glitchText');
const muteBtn = document.getElementById('muteBtn');
const deleteBtn = document.getElementById('deleteBtn');
const timestamp = document.getElementById('timestamp');

// update timestamp
function updateTime() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    timestamp.textContent = `REC ${h}:${m}:${s}`;
}

setInterval(updateTime, 1000);
updateTime();

// load saved confessions
function load() {
    const saved = localStorage.getItem('confessions');
    if (saved) {
        confessions = JSON.parse(saved);
        updateDisplay();
    }
}

// save confessions
function save() {
    localStorage.setItem('confessions', JSON.stringify(confessions));
}

// update UI
function updateDisplay() {
    count.textContent = `[${confessions.length} STORED]`;
    
    if (confessions.length > 0) {
        const recent = confessions.slice(-5).reverse();
        historyList.innerHTML = '<p style="margin-bottom: 1rem;">PREVIOUS RECORDINGS:</p>' +
            recent.map(c => {
                const preview = c.text.substring(0, 50);
                return `<div class="history-item">"${preview}${c.text.length > 50 ? '...' : ''}"</div>`;
            }).join('');
    }
}

// update character count
function updateCount() {
    const len = input.value.length;
    charInfo.textContent = `${len}/200`;
    submitBtn.disabled = input.value.trim() === '';
}

// submit confession
function submit() {
    const text = input.value.trim();
    if (!text) return;
    
    // create new confession object
    const newConfession = {
        id: Date.now(),
        text: text,
        timestamp: new Date().toISOString()
    };
    
    confessions.push(newConfession);
    save();
    
    input.value = '';
    updateCount();
    updateDisplay();
    
    // show confirmation
    recorded.classList.add('show');
    setTimeout(() => {
        recorded.classList.remove('show');
    }, 3000);
    
    // start whispers if first confession
    if (confessions.length === 1) {
        scheduleWhisper();
    }
}

// show whisper
function showWhisper(confession) {
    whisperContent.textContent = `"${confession.text}"`;
    
    const date = new Date(confession.timestamp);
    whisperDate.textContent = `RECORDED: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    whisperBox.classList.add('show');
    
    glitch(confession.text);
    
    // speak it
    if (!muted && 'speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(confession.text);
        speech.rate = 0.6;
        speech.pitch = 0.7;
        speech.volume = 0.5;
        speechSynthesis.speak(speech);
    }
    
    // hide after 5 seconds
    setTimeout(() => {
        whisperBox.classList.remove('show');
    }, 5000);
}

// glitch effect
function glitch(text) {
    const chars = '█▓▒░■□▪▫';
    let glitched = text.split('').map(c => 
        Math.random() > 0.6 ? chars[Math.floor(Math.random() * chars.length)] : c
    ).join('');
    
    glitchText.textContent = glitched;
    glitchText.classList.add('show');
    
    setTimeout(() => {
        glitchText.classList.remove('show');
    }, 300);
}

// schedule random whispers
function scheduleWhisper() {
    if (confessions.length === 0 || muted) return;
    
    const delay = Math.random() * 10000 + 5000; // 5-15 seconds
    
    whisperTimer = setTimeout(() => {
        const random = confessions[Math.floor(Math.random() * confessions.length)];
        showWhisper(random);
        scheduleWhisper();
    }, delay);
}

// toggle mute
function toggleMute() {
    muted = !muted;
    muteBtn.classList.toggle('muted');
    muteBtn.textContent = muted ? 'UNMUTE' : 'MUTE';
    
    if (muted) {
        speechSynthesis.cancel();
        if (whisperTimer) {
            clearTimeout(whisperTimer);
        }
    } else {
        scheduleWhisper();
    }
}

// delete all
function deleteAll() {
    if (confirm('ERASE ALL RECORDINGS?')) {
        confessions = [];
        localStorage.removeItem('confessions');
        speechSynthesis.cancel();
        if (whisperTimer) {
            clearTimeout(whisperTimer);
        }
        updateDisplay();
        historyList.innerHTML = '';
    }
}

// event listeners
input.addEventListener('input', updateCount);

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        submit();
    }
});

submitBtn.addEventListener('click', submit);
muteBtn.addEventListener('click', toggleMute);
deleteBtn.addEventListener('click', deleteAll);

// initialize
load();
if (confessions.length > 0) {
    scheduleWhisper();
}