let confessions = [];
let isMuted = false;
let whisperTimeout = null;

const elements = {
    input: document.getElementById('confessionInput'),
    confessBtn: document.getElementById('confessBtn'),
    charCount: document.getElementById('charCount'),
    confirmation: document.getElementById('confirmation'),
    counter: document.getElementById('counter'),
    history: document.getElementById('history'),
    whisperDisplay: document.getElementById('whisperDisplay'),
    whisperText: document.getElementById('whisperText'),
    whisperDate: document.getElementById('whisperDate'),
    glitchOverlay: document.getElementById('glitchOverlay'),
    muteBtn: document.getElementById('muteBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
    timestamp: document.getElementById('timestamp')
};

function updateTimestamp() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    elements.timestamp.textContent = `REC ${hours}:${minutes}:${seconds}`;
}

setInterval(updateTimestamp, 1000);
updateTimestamp();

function loadConfessions() {
    const stored = localStorage.getItem('confessions');
    if (stored) {
        try {
            confessions = JSON.parse(stored);
            updateUI();
        } catch (e) {
            console.error('Failed to load confessions');
        }
    }
}

function saveConfessions() {
    localStorage.setItem('confessions', JSON.stringify(confessions));
}

function updateUI() {
    elements.counter.textContent = `[${confessions.length} STORED]`;
    
    if (confessions.length > 0) {
        const recent = confessions.slice(-5).reverse();
        elements.history.innerHTML = '<p style="margin-bottom: 1rem;">PREVIOUS RECORDINGS:</p>' +
            recent.map(c => {
                const preview = c.text.substring(0, 50);
                return `<div class="history-item">"${preview}${c.text.length > 50 ? '...' : ''}"</div>`;
            }).join('');
    }
}

function updateCharCount() {
    const length = elements.input.value.length;
    elements.charCount.textContent = `${length}/200`;
    elements.confessBtn.disabled = elements.input.value.trim() === '';
}

function confess() {
    const text = elements.input.value.trim();
    if (!text) return;
    
    const newConfession = {
        id: Date.now(),
        text: text,
        timestamp: new Date().toISOString()
    };
    
    confessions.push(newConfession);
    saveConfessions();
    
    elements.input.value = '';
    updateCharCount();
    updateUI();
    
    elements.confirmation.classList.add('active');
    setTimeout(() => {
        elements.confirmation.classList.remove('active');
    }, 3000);
    
    if (confessions.length === 1) {
        scheduleWhisper();
    }
}

function triggerWhisper(confession) {
    elements.whisperText.textContent = `"${confession.text}"`;
    
    const date = new Date(confession.timestamp);
    elements.whisperDate.textContent = `RECORDED: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    elements.whisperDisplay.classList.add('active');
    
    createGlitch(confession.text);
    
    if (!isMuted && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(confession.text);
        utterance.rate = 0.6;
        utterance.pitch = 0.7;
        utterance.volume = 0.5;
        speechSynthesis.speak(utterance);
    }
    
    setTimeout(() => {
        elements.whisperDisplay.classList.remove('active');
    }, 5000);
}

function createGlitch(text) {
    const glitchChars = '█▓▒░■□▪▫';
    let glitched = text.split('').map(char => 
        Math.random() > 0.6 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : char
    ).join('');
    
    elements.glitchOverlay.textContent = glitched;
    elements.glitchOverlay.classList.add('active');
    
    setTimeout(() => {
        elements.glitchOverlay.classList.remove('active');
    }, 300);
}

function scheduleWhisper() {
    if (confessions.length === 0 || isMuted) return;
    
    const delay = Math.random() * 10000 + 5000;
    
    whisperTimeout = setTimeout(() => {
        const randomConfession = confessions[Math.floor(Math.random() * confessions.length)];
        triggerWhisper(randomConfession);
        scheduleWhisper();
    }, delay);
}

function toggleMute() {
    isMuted = !isMuted;
    elements.muteBtn.classList.toggle('muted');
    elements.muteBtn.textContent = isMuted ? 'UNMUTE' : 'MUTE';
    
    if (isMuted) {
        speechSynthesis.cancel();
        if (whisperTimeout) {
            clearTimeout(whisperTimeout);
        }
    } else {
        scheduleWhisper();
    }
}

function deleteAll() {
    if (confirm('ERASE ALL RECORDINGS?')) {
        confessions = [];
        localStorage.removeItem('confessions');
        speechSynthesis.cancel();
        if (whisperTimeout) {
            clearTimeout(whisperTimeout);
        }
        updateUI();
        elements.history.innerHTML = '';
    }
}

elements.input.addEventListener('input', updateCharCount);

elements.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        confess();
    }
});

elements.confessBtn.addEventListener('click', confess);
elements.muteBtn.addEventListener('click', toggleMute);
elements.deleteBtn.addEventListener('click', deleteAll);

loadConfessions();
if (confessions.length > 0) {
    scheduleWhisper();
}