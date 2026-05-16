// Canva API Configuration
const API_BASE_URL = 'https://spotify-canva.vercel.app';
// Ultra-fast proxy for local development
const PROXY_URL = 'https://corsproxy.io/?';

let currentTrackId = '6Uj1ctrBOjOas8xZXGqKk4';
let activeSnippetLang = 'curl';
let lastFetchedData = null;

const trackInfoMap = {
    '6Uj1ctrBOjOas8xZXGqKk4': { title: 'Woman', artist: 'Doja Cat' },
    '3OHfY25tqY28d16oZczHc8': { title: 'Kill Bill', artist: 'SZA' },
    '6qYkmqFsXbj8CQjAdbYz07': { title: 'Blinding Lights', artist: 'The Weeknd' },
    '6dOtVTDdiauQNBQEDOtlAB': { title: 'Birds of a Feather', artist: 'Billie Eilish' },
    '2qSkIjg1o9h3YT9RAgYN75': { title: 'Espresso', artist: 'Sabrina Carpenter' }
};

const snippetTemplates = {
    curl: (trackId) => `curl -X GET "${API_BASE_URL}/api/canvas?trackId=${trackId}"`,
    js: (trackId) => `fetch("${API_BASE_URL}/api/canvas?trackId=${trackId}")
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Error:", error));`,
    python: (trackId) => `import requests

url = "${API_BASE_URL}/api/canvas"
params = {"trackId": "${trackId}"}

response = requests.get(url, params=params)
if response.status_code == 200:
    data = response.json()
    print(data)
else:
    print(f"Error: {response.status_code}")`,
    node: (trackId) => `const axios = require('axios');

axios.get('${API_BASE_URL}/api/canvas', {
    params: { trackId: '${trackId}' }
})
.then(response => {
    console.log(response.data);
})
.catch(error => {
    console.error('Error fetching canvas:', error);
});`
};

// UI Selectors
const elTrackInput = document.getElementById('track-id-input');
const elBtnFetch = document.getElementById('btn-fetch');
const elLiveUrlDisplay = document.getElementById('live-url-display');
const elSnippetCodeBlock = document.getElementById('snippet-code-block');
const elJsonOutputBlock = document.getElementById('json-output-block');
const elPlayerVideo = document.getElementById('player-canvas-video');
const elVideoErrorPlaceholder = document.querySelector('.canvas-error-placeholder');
const elPlayerTrackName = document.getElementById('player-track-name');
const elPlayerArtistName = document.getElementById('player-artist-name');
const elPlayerPlayBtn = document.getElementById('player-btn-play');
const elIphoneMockup = document.querySelector('.iphone-mockup');
const elToast = document.getElementById('toast');
const elToastMessage = document.getElementById('toast-message');
const elBtnCopyUrl = document.getElementById('btn-copy-url');
const elBtnCopySnippet = document.getElementById('btn-copy-snippet');
const elBtnCopyJson = document.getElementById('btn-copy-json');

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    setupTabToggles();
    setupPresetChips();
    setupCopyHandlers();
    setupPlayerLogic();
    
    elTrackInput.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (val.startsWith('spotify:track:')) val = val.split(':').pop();
        currentTrackId = val || '6Uj1ctrBOjOas8xZXGqKk4';
        updateInteractiveElements();
    });
    
    elBtnFetch.addEventListener('click', () => fetchCanvasData(true));
    // Initial load
    fetchCanvasData(false);
});

function syntaxHighlight(json) {
    if (typeof json !== 'string') json = JSON.stringify(json, null, 2);
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) cls = 'json-key';
            else cls = 'json-string';
        } else if (/true|false/.test(match)) cls = 'json-boolean';
        else if (/null/.test(match)) cls = 'json-null';
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function showToast(message, isSuccess = true) {
    elToastMessage.textContent = message;
    const elIcon = elToast.querySelector('.toast-icon');
    if (isSuccess) {
        elIcon.setAttribute('data-lucide', 'check');
        elIcon.style.color = 'var(--accent)';
        elToast.style.borderColor = 'var(--accent)';
    } else {
        elIcon.setAttribute('data-lucide', 'alert-circle');
        elIcon.style.color = '#f43f5e';
        elToast.style.borderColor = '#f43f5e';
    }
    lucide.createIcons();
    elToast.classList.remove('hidden');
    setTimeout(() => elToast.classList.add('hidden'), 2800);
}

function copyTextToClipboard(text, successMsg) {
    if (!navigator.clipboard) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast(successMsg);
        } catch (err) {
            showToast('Copy failed', false);
        }
        document.body.removeChild(textArea);
        return;
    }
    navigator.clipboard.writeText(text).then(() => showToast(successMsg)).catch(() => showToast('Copy failed', false));
}

function updateInteractiveElements() {
    const fullUrl = `${API_BASE_URL}/api/canvas?trackId=${currentTrackId}`;
    elLiveUrlDisplay.textContent = fullUrl;
    if (snippetTemplates[activeSnippetLang]) {
        elSnippetCodeBlock.textContent = snippetTemplates[activeSnippetLang](currentTrackId);
    }
}

function setupTabToggles() {
    document.querySelectorAll('.display-tab').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            const container = tabBtn.parentElement;
            container.querySelectorAll('.display-tab').forEach(b => b.classList.remove('active'));
            tabBtn.classList.add('active');
            const targetId = tabBtn.getAttribute('data-target');
            const paneContainer = container.nextElementSibling;
            paneContainer.querySelectorAll('.display-pane').forEach(p => p.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    document.querySelectorAll('.auth-step-indicator').forEach(stepBtn => {
        stepBtn.addEventListener('click', () => {
            const sidebar = stepBtn.parentElement;
            sidebar.querySelectorAll('.auth-step-indicator').forEach(b => b.classList.remove('active'));
            stepBtn.classList.add('active');
            const stepNum = stepBtn.getAttribute('data-step');
            const contentWrap = sidebar.nextElementSibling;
            contentWrap.querySelectorAll('.auth-step-content').forEach(p => p.classList.remove('active'));
            document.getElementById(`auth-step-${stepNum}`).classList.add('active');
        });
    });

    document.querySelectorAll('.terminal-tab').forEach(termBtn => {
        termBtn.addEventListener('click', () => {
            const header = termBtn.parentElement;
            header.querySelectorAll('.terminal-tab').forEach(b => b.classList.remove('active'));
            termBtn.classList.add('active');
            const targetPaneId = termBtn.getAttribute('data-target');
            const body = header.nextElementSibling;
            body.querySelectorAll('.terminal-pane').forEach(p => p.classList.remove('active'));
            document.getElementById(targetPaneId).classList.add('active');
        });
    });

    document.querySelectorAll('.snippet-tab').forEach(snBtn => {
        snBtn.addEventListener('click', () => {
            const tabsWrap = snBtn.parentElement;
            tabsWrap.querySelectorAll('.snippet-tab').forEach(b => b.classList.remove('active'));
            snBtn.classList.add('active');
            activeSnippetLang = snBtn.getAttribute('data-lang');
            updateInteractiveElements();
        });
    });

    document.querySelectorAll('.sidebar-link').forEach(sideLink => {
        sideLink.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            sideLink.classList.add('active');
        });
    });
}

function setupPresetChips() {
    document.querySelectorAll('.preset-chips .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.preset-chips .chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const id = chip.getAttribute('data-track-id');
            elTrackInput.value = id;
            currentTrackId = id;
            updateInteractiveElements();
            fetchCanvasData(true);
        });
    });
}

function setupCopyHandlers() {
    elBtnCopyUrl.addEventListener('click', () => {
        const urlStr = `${API_BASE_URL}/api/canvas?trackId=${currentTrackId}`;
        copyTextToClipboard(urlStr, 'URL copied!');
    });

    elBtnCopySnippet.addEventListener('click', () => {
        copyTextToClipboard(elSnippetCodeBlock.textContent, 'Snippet copied!');
    });

    elBtnCopyJson.addEventListener('click', () => {
        if (!lastFetchedData) {
            showToast('No JSON response', false);
            return;
        }
        copyTextToClipboard(JSON.stringify(lastFetchedData, null, 2), 'JSON copied!');
    });

    document.querySelectorAll('.btn-copy-box').forEach(btn => {
        btn.addEventListener('click', () => {
            copyTextToClipboard(btn.getAttribute('data-copy'), 'Copied!');
        });
    });
}

function setupPlayerLogic() {
    elPlayerPlayBtn.addEventListener('click', () => {
        if (elPlayerVideo.paused) {
            elPlayerVideo.play().then(() => {
                elIphoneMockup.classList.remove('paused');
                elPlayerPlayBtn.innerHTML = '<i data-lucide="pause"></i>';
                lucide.createIcons();
            }).catch(() => showToast('Failed to resume', false));
        } else {
            elPlayerVideo.pause();
            elIphoneMockup.classList.add('paused');
            elPlayerPlayBtn.innerHTML = '<i data-lucide="play"></i>';
            lucide.createIcons();
        }
    });
}

async function fetchCanvasData(isManual = false) {
    const trackVal = elTrackInput.value.trim();
    if (!trackVal) {
        if (isManual) showToast('Enter a track ID', false);
        return;
    }
    
    let trackIdClean = trackVal.startsWith('spotify:track:') ? trackVal.split(':').pop() : trackVal;
    currentTrackId = trackIdClean;
    updateInteractiveElements();
    
    elBtnFetch.disabled = true;
    elBtnFetch.querySelector('.btn-text').textContent = 'Fetching...';
    elBtnFetch.querySelector('.spinner').classList.remove('hidden');
    elJsonOutputBlock.textContent = 'Searching Spotify...';
    
    try {
        let queryUrl = `${API_BASE_URL}/api/canvas?trackId=${currentTrackId}`;
        
        // Apply CORS Proxy for local development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            queryUrl = PROXY_URL + encodeURIComponent(queryUrl);
        }
        
        const response = await fetch(queryUrl);
        if (!response.ok) throw new Error('Spotify API temporarily unreachable');
        
        const payload = await response.json();
        lastFetchedData = payload;
        elJsonOutputBlock.innerHTML = syntaxHighlight(payload);
        
        const canvasList = payload.canvasesList;
        if (canvasList && canvasList.length > 0) {
            const canvasUrl = canvasList[0].canvasUrl;
            elVideoErrorPlaceholder.classList.add('hidden');
            elPlayerVideo.classList.remove('hidden');
            elPlayerVideo.src = canvasUrl;
            elPlayerVideo.play().then(() => {
                elIphoneMockup.classList.remove('paused');
                elPlayerPlayBtn.innerHTML = '<i data-lucide="pause"></i>';
                lucide.createIcons();
            }).catch(() => {});
            
            const canvasObj = canvasList[0];
            elPlayerArtistName.textContent = (canvasObj.artist && canvasObj.artist.artistName) ? canvasObj.artist.artistName : (trackInfoMap[currentTrackId] ? trackInfoMap[currentTrackId].artist : 'Artist');
            elPlayerTrackName.textContent = trackInfoMap[currentTrackId] ? trackInfoMap[currentTrackId].title : 'Spotify Track';
            
            if (isManual) showToast('Canvas updated!');
        } else {
            throw new Error('No Canvas for this track');
        }
        
    } catch (error) {
        console.error('Fetch error:', error);
        elJsonOutputBlock.innerHTML = syntaxHighlight({ error: error.message });
        elPlayerVideo.src = '';
        elPlayerVideo.classList.add('hidden');
        elVideoErrorPlaceholder.classList.remove('hidden');
        elPlayerTrackName.textContent = 'Error';
        elPlayerArtistName.textContent = 'Fetch Failed';
        elIphoneMockup.classList.add('paused');
        if (isManual) showToast(error.message, false);
    } finally {
        elBtnFetch.disabled = false;
        elBtnFetch.querySelector('.btn-text').textContent = 'Fetch Canvas';
        elBtnFetch.querySelector('.spinner').classList.add('hidden');
    }
}
